---
创建时间: 2026-02-10
最后修改: 2026-02-15
状态:
  - Inbox
tags:
  - #audio
---
![](https://pic4.zhimg.com/v2-98c462e8b95814ec3181bd47c8ea194f_r.jpg)




## 前言

你买了家用摄像头，却发现自己陷入了**云存储陷阱** ：想看几天前的回放，就得每月按时交保护费。明明是自己家的监控视频，却不得不传到别人的服务器上，**隐私泄露风险** 让人提心吊胆。退一步用SD卡吧？不仅**容量有限** ，关键时刻还容易**读写错误** ，找段关键录像简直像大海捞针。

上期我们介绍了通过**Micam三件套** 将摄像头接入**飞牛NAS** 的方案，成功实现了本地化存储。但方案对低配设备不够友好，特别是**N1盒子** 这种只有2GB内存的设备，跑3个容器确实有些吃力。

问题就在这里——**Micam方案** 其实是之前的替代方案，因为当时**Go2RTC** 还未支持小米摄像头协议。虽然Micam能实现功能，但**3个容器同时运行** 会占用过多系统资源，对低配设备不够友好。

本期我们就来解决这个痛点。通过**Go2RTC+EasyNVR双容器方案** ，容器数量从4个减少到2个，**内存占用大幅降低** ，部署配置也**更简单** 。读完这篇文章，你将能用更轻量的方案，在低配设备上流畅运行摄像头本地存储，真正告别云存储月费，实现**永久免费、无限扩容** 的私有化监控系统。

## 1 什么是Go2RTC？




![](https://pic2.zhimg.com/v2-df638c585c8e86860814bfb6e1ea62f7_r.jpg)




**Go2RTC**  是一款功能强大的**通用摄像头流媒体服务器** ，专为解决安防监控领域的视频协议兼容性与低延迟传输难题而设计。它能够作为一个高效的中转网关，将各类传统的监控视频流汇聚并转换为现代化的 Web 友好协议。

作为核心组件，Go2RTC 具备以下关键特性：

- **多协议互通** ：原生支持 RTSP、RTMP、HTTP-FLV、WebRTC、MSE、HLS、MJPEG 等几乎所有主流流媒体协议，实现了不同设备与平台间的无缝对接。
- **极致低延迟** ：通过 WebRTC 和 MSE 技术，它能将视频传输延迟降低至毫秒级，提供真正实时的监控体验。
- **轻量级架构** ：采用 Go 语言开发，编译为独立的二进制文件，零外部依赖。这意味着它不仅部署简便，而且对硬件资源占用极低，非常适合在 NAS、树莓派等边缘设备上长期运行。
- **灵活扩展** ：既支持 Docker 容器化部署，也能完美集成到 Home Assistant 等智能家居系统中。

在本方案中，Go2RTC 扮演着“流媒体引擎”的角色：它负责从摄像头拉取原始视音频流，经过实时处理后，不仅能直接通过浏览器流畅播放，还能将标准化的视频流分发给 EasyNVR 进行持久化存储。

## 2 准备阶段

### 2.1 部署环境和系统说明

本期教程以用N1刷入arm版的飞牛Nas系统为例，其他Nas系统支持Docker均可（如：绿联Nas、极空间Nas,群晖Nas等）。

![](https://pic3.zhimg.com/v2-d1f8bb53892d642693e8d0e9a9de8d96_r.jpg)




如果同样有想刷入arm版飞牛Nas的小伙伴可以先移步这篇：[7年矿渣重生！N1盒子刷入ARM版飞牛NAS！(保姆级教程)](https://www.cpolar.com/blog/7-year-old-slag-rebirth-install-the-arm-version-of-feibo-nas-on-the-n1-box-step-by-step-tutorial) 文章。目前N1的arm版飞牛固件已支持**无线网卡驱动** ，可以通过连接WiFI的方式来进行联网。可以刷入**453** 版固件，然后进行**OTA** 升级至**当前最新1.1.18系统版本** 即可。

**N1飞牛Nas系统arm版固件资源-453版** 下载地址如下： 123永久云盘链接： [123云盘](#)

提取码：**1314** 

### 2.2 启动Docker服务

在部署之前，首先确保你的Docker为启动状态，在飞牛Nas首页，点击**Docker** 图标，进入应用内启动**Docker服务** ： 

![](https://picx.zhimg.com/v2-0c64b60e45017ff4488715d413fa9313_r.jpg)




> **PS：** 建议存储位置选择挂载的外部存储空间。

### 2.3 启用SSH服务并连接

进入飞牛Nas的系统设置，来到SSH项，将SSH功能设置为**启用** ： 

![](https://picx.zhimg.com/v2-148d5757b7eaff9a758e639997777fbd_r.jpg)




设置好以后，接着电脑上摁**Win + X键** ，选择终端（管理员），打开PowerShell窗口（cmd命令提示符窗口也可以的）：




![](https://pica.zhimg.com/v2-c7a582bea8dc0d7f8802cb44c81779b0_r.jpg)




接着，输入如下命令连接你的飞牛NAS（也可以使用其他**ssh工具** ）：

```bash
# ssh 你的Nas用户名@你的Nas系统IP地址
ssh n1@192.168.50.228
```




![](https://pic1.zhimg.com/v2-52f07d1f0b4fda48af51c48acb5efde4_r.jpg)




连接成功后，输入如下命令，然后输入密码，切换至root用户：

```text
sudo -i
```




![](https://pic1.zhimg.com/v2-8a4ce8b8f18e8ddd152de1c2617c1062_r.jpg)




这样就成功连接上了飞牛Nas的ssh终端啦！

## 3 Docker部署Go2RTC

在终端，输入如下docker命令，进行一键部署：

```text
mkdir -p $(pwd)/go2rtc/config && touch $(pwd)/go2rtc/config/go2rtc.yaml && docker run -d --name go2rtc --restart always --network host -v $(pwd)/go2rtc/config:/config alexxit/go2rtc
```

命令会进行创建**/go2rtc/config** 目录和创建**go2rtc.yaml** 配置文件，并且执行Docker一键部署命令，如下图： 

![](https://picx.zhimg.com/v2-707d4c0128fba5046175e7ed209e3c51_r.jpg)




部署完成后，输入如下命令，查看运行状态：

```text
docker ps
```




![](https://pica.zhimg.com/v2-28ef19ba6c490185b02a037a02025f60_r.jpg)




可以看到，status(状态)显示为**UP** ,代表其运行中，接在在浏览器访问**你的飞牛Nas的IP地址+1984端口** 即可访问到web页面:

```text
http://192.168.50.228:1984
```




![](https://pic2.zhimg.com/v2-94cccf820a39771d2b9cb079ffbb5033_r.jpg)




可以看到，成功的访问到页面啦！go2rtc就部署好了！

## 4 配置小米摄像头获取RTSP地址

首先，点击顶部导航栏的**add** 菜单，进入如下页面： 

![](https://pica.zhimg.com/v2-ab1d0e4695ccf658a0f46100146cae2e_r.jpg)




接着，滚动到底部，展开**Xiaomi** 这一栏，填写你的小米账号信息，进行登录，然后点击加载设备：




![](https://picx.zhimg.com/v2-9831e1972cbbc64bdae906fbeafea395_r.jpg)




复制url,然后滚动到顶部，选择顶部导航栏的**config** 菜单，在yaml配置区输入如下配置：

```yaml
# =================================================================
# GO2RTC 示例配置文件
# -----------------------------------------------------------------
# 【使用说明】
# 1. 访问后台：http://宿主机IP:1984 (默认账号: admin / 密码: password)
# 2. RTSP构造：若取消rtsp段落注释，播放地址如下：
#    - 4K流: rtsp://admin:password@宿主机IP:8554/cam_4k
#    - 标准: rtsp://admin:password@宿主机IP:8554/cam_std
# 3. 参数说明：
#    - subtype=3: 锁定 4K 极清分辨率
#    - subtype=2: 锁定 1080P/2K 高清分辨率
#    - #audio=pcmu: 强制音频解码，解决部分设备无声问题
# =================================================================
​
api:
  listen: ":1984"
  username: admin
  password: "password"
​
# rtsp:
#   listen: ":8554"
#   username: admin
#   password: "password"
​
streams:
  xiaomi:
    - "you_xiaomi_url&subtype=2#video=copy#audio=pcmu"
  xiaomi_4k:
    - "you_xiaomi_url&subtype=3#video=copy#audio=pcmu"
​
xiaomi:
  "USER_ID": V1:EXAMPLE_TOKEN
```

即如下图所示： 

![](https://pic1.zhimg.com/v2-305eb24ab47867b67d87997761a5a3f6_r.jpg)




设置完成后，点击**Save & Restart** 按钮，进行保存并且重启，接着回到首页，点击stream进去，验证是否能播放：




![](https://pic1.zhimg.com/v2-d7fc54204474fb6765849b638c3fc414_r.jpg)




如下能够出现画面即代表配置成功啦： 

![](https://pic1.zhimg.com/v2-56c5de810fe3b232cee2837bbd7c6570_r.jpg)




由于前面配置中开启了rtsp的用户名和密码功能，以xiaomi_4k这个流为例，所以rtsp的流地址应为：

```text
# 无密码的构建方式
rtsp://宿主机IP:8554/xiaomi_4k
​
# 开启密码认证的构建方式
rtsp://admin:123456@宿主机IP:8554/xiaomi_4k
```

在**PotPlayer** 播放器中进行演示，按**ctrl + u** 快速打开播放网络地址窗口，输入rtsp的流进行测试： 

![](https://picx.zhimg.com/v2-7a6cf4d270baee6099d8459ea8acd79f_r.jpg)




播放成功，这样我们就完成了**Go2RTC** 的部署和测试，摄像头视频流已经成功转换为标准RTSP协议。

## 5 Docker部署EasyNVR

现在我们已经有了标准的RTSP视频流，接下来就需要将这些流接入**EasyNVR** 进行录像存储和管理。EasyNVR作为专业的NVR系统，能够提供录像、回放、告警等完整的监控功能。

### 5.1 EasyNVR介绍




![](https://pic1.zhimg.com/v2-67ff3eb768c0114b5c01052d81242474_r.jpg)




**EasyNVR**  是一款专业的**软件型网络录像机（Network Video Recorder，NVR）** ，用于集中管理和录像多路网络摄像头的视频流。它可以替代摄像头厂商提供的云存储服务，将录像统一存储在本地 NAS 或服务器上，实现完全的本地化管理。

EasyNVR 的核心功能包括：**多摄像头接入** ，支持 **RTSP、RTMP、ONVIF**  等标准协议，并能够接入不同品牌和型号的摄像头，实现统一管理；**本地录像存储** ，视频数据直接写入 NAS 或本地服务器，不依赖厂商云服务，从而避免长期订阅费用，同时支持长期录像和循环覆盖策略；**实时监控与历史回放** ，通过 Web 界面集中管理所有摄像头，可以查看实时画面、快速定位历史录像，并支持多路同步播放和时间轴浏览；**稳定运行** ，可在 NAS、迷你主机或家用服务器上 7×24 稳定运行，Docker 部署支持跨平台、快速安装和升级。

### 5.2 Docker一键部署EasyNVR

回到N1的终端窗口，输入如下命令，查看磁盘占用及情况：

```text
df -h
```




![](https://pic3.zhimg.com/v2-8e91f860605af27e000b6fe49720796a_r.jpg)




可以看到，外置存储大小一共**239G** ,挂载的根路径为**vol1** ,所以我们需要将录像存储路径改为该位置,首先在该位置单独创建一个文件夹：

```text
mkdir -p /vol1/EasyNVR
cd /vol1/EasyNVR
```

然后进行一键部署EasyNVR（注意替换存储路径）：

```text
docker run -d --name easynvr --restart always --network host --log-opt max-size=50M -v "$PWD/configs:/app/configs" -v "$PWD/logs:/app/logs" -v "$PWD/temporary:/app/temporary" -v /vol1/EasyNVR:/app/r -v "$PWD/stream:/app/stream" registry.cn-shanghai.aliyuncs.com/rustc/easynvr_arm64:latest
```

如下图所示： 

![](https://pic4.zhimg.com/v2-480009a919226e73d1268ac1ea0c5c67_r.jpg)




接着，在浏览器中访问你的**飞牛Nas主机ip地址+10000端口** ,即可访问到**EasyNVR** 页面了： 

![](https://pic2.zhimg.com/v2-cb27df55d391419d1f9e5e88fd28d0c7_r.jpg)







### 5.3 初始化登录EasyNVR

访问到EasyNVR页面后，直接点击页面的登录按钮即可进入首页，然后语言设置直接选择简体，确定即可：




![](https://pic4.zhimg.com/v2-e399d197d44a4acf998a4ee54005a7fb_r.jpg)




属性配置为你的局域网地址，一般自动获取正确，不用修改，直接点击确定即可： 

![](https://pic4.zhimg.com/v2-80fd27ab6c5899778cd1769777d162a5_r.jpg)




开放端口页面，默认无需操作，直接下一步即可： 

![](https://picx.zhimg.com/v2-6245ee68ead5c50550e0925b84967f73_r.jpg)




在重置账号页面，创建一个新的管理员账户，点击确定： 

![](https://picx.zhimg.com/v2-8d09ca554bee88402555a8846333ee6d_r.jpg)




这样就完成初始化操作啦，使用新的账号进行登录，即可进入EasyNVR首页： 

![](https://pic4.zhimg.com/v2-73879471e8c833998c9a4866b8acbabd_r.jpg)




## 6 将RTSP流接入EasyNVR

前面已经介绍了EasyNVR支持接入 **RTSP、RTMP、ONVIF**  等标准协议，并能够接入不同品牌和型号的摄像头，实现统一管理。简单说一下区别：**RTSP**  是纯视频流协议，只能拉流观看，不支持云台控制；**RTMP**  主要用于推流场景，同样不支持设备控制；而 **ONVIF**  是一套完整的设备管理标准，除了拉流外还支持**云台控制、设备发现、参数配置** 等功能，如果你的摄像头支持 ONVIF，优先推荐使用它接入。

首先打开EasyNVR的首页，然后选择**设备列表** 菜单，点击**添加** 按钮：




![](https://pic1.zhimg.com/v2-2d5bf6ded76dba9d2c98a427ceb4e75c_r.jpg)




这里由于是**RTSP协议地址** ，所以选择**PULL** ,下面也可以看到提示为接入设备**RTSP、HTTP、TCP实时流** ，然后填写好**拉流地址** ，点击确定：




![](https://pic2.zhimg.com/v2-1a5ad69f0921bc2e3cd25e358e1a5be9_r.jpg)




点击确定后，就可以看到你的设备添加上来了，可以看到在线状态：




![](https://pic4.zhimg.com/v2-f8a29e640b563e8b5c8ee2e26de18741_r.jpg)




点击播放图标，点击进入，然后可以看到录像计划显示为**未录像** ，这里直接将其设置为，这样就会一直录制啦：




![](https://pic4.zhimg.com/v2-3d92089ef99ee82f47af16a7e5d8d5bb_r.jpg)




点击下方的直播中按钮，即可进入到观看页面：




![](https://pic2.zhimg.com/v2-e62afae49e3bbdd4373570985b46e0fb_r.jpg)




如下图所示：




![](https://pic2.zhimg.com/v2-7d4844538a21664ea0c798ce05c8f179_r.jpg)




可以看到，该直播预览页面集成了**多协议实时播放、线路切换、云台控制与参数可视化** 等能力，用户可根据实际场景在 **WebRTC、HTTP-FLV、RTMP、RTSP**  等协议间自由切换以兼顾**延迟与兼容性** ；在视频播放的同时，页面还实时展示**分辨率、编码格式、传输方式、码率等关键流媒体信息** ，便于调试与排障；若视频流协议源本身支持云台控制，还可直接在页面中完成**方向控制、变倍与速度调节** ，实现从预览到运维的一体化操作。

## 7  查看录像回放

前面设置好了录像计划，设置的为**每天** ，设置好后就会**即刻开始录像** 。我们回到首页，选择菜单的**录像回放** ：




![](https://pic2.zhimg.com/v2-3675987d8811b135051f87156cc64c03_r.jpg)




我们直接点击查看图标，即可进来回放页面了：




![](https://pic1.zhimg.com/v2-cb3df287e64a9b6416c460863abffb22_r.jpg)




不仅回放功能，还支持选择指定时间段进行下载:




![](https://pica.zhimg.com/v2-3c89abf3e0667e1fa5761286d06c4708_r.jpg)




好啦，基本设置就完成啦，EasyNVR还拥有更多功能值得你去探索！

## 8 穿透EasyNVR实现公网访问

到这里，EasyNVR 已经在飞牛 NAS 上跑起来了，录像也都存在本地硬盘上，**彻底告别了云存储月租费** 。但问题来了：虽然各家摄像头 APP 也能看实时画面，但想**回看历史录像就要交钱** ，而且家里几个不同品牌的摄像头还得装好几个 APP，管理起来很麻烦。

有了 **cpolar 内网穿透** ，这些问题就迎刃而解了。只需简单配置，就能让 EasyNVR **通过公网地址随时随地访问** ——不仅能看实时画面，更重要的是**免费回放本地存储的所有录像** 。而且一个链接就能分享给家人，**不用每个人都装 APP、注册账号，浏览器打开就能看** 。

### 8.1 什么是cpolar?




![](https://pic3.zhimg.com/v2-dc830affbcc249daf6bb9a6f88b5753c_r.jpg)




- **cpolar 是一款内网穿透工具** ，可以将你在局域网内运行的服务（如本地 Web 服务器、SSH、远程桌面等）通过一条安全加密的中间隧道映射至公网，让外部设备无需配置路由器即可访问。
- 广泛支持 **Windows、macOS、Linux、树莓派、群晖 NAS**  等平台，并提供一键安装脚本方便部署。

### 8.2 安装cpolar

在前面连接的飞牛终端中输入如下命令，一键安装cpolar：

```text
sudo curl https://get.cpolar.sh | sh
```




![](https://pic4.zhimg.com/v2-4b96268707f20083c584dc5087467cfb_r.jpg)




安装完成后，执行下方命令查看cpolar服务状态：（如图所示即为正常启动）

```text
sudo systemctl status cpolar
```




![](https://picx.zhimg.com/v2-81e1b9b27fed2025a6545c2f1af86abf_r.jpg)




### 8.3 注册及登录cpolar web ui管理界面

官网链接：

[cpolar官网-安全的内网穿透工具 | 无需公网ip | 远程访问 | 搭建网站](https://www.cpolar.com/)

访问`cpolar`官网，点击`免费注册`按钮，进行账号注册




![](https://pic1.zhimg.com/v2-11da4fdfbf02e90234a070ef2a940d76_r.jpg)




进入到如下的注册页面进行账号注册： 

![](https://picx.zhimg.com/v2-e5270ccfe7019309ff79b17aad89c6b3_r.jpg)




注册完成后,在浏览器中输入飞牛NAS的**IP地址+9200端口** 访问 web ui管理界面:

```text
http://192.168.50.228:9200/
```




![](https://pic3.zhimg.com/v2-f84e47bc1e85e529e2b2324dd5215104_r.jpg)




输入刚才注册好的cpolar账号登录即可进入后台页面:




![](https://pic2.zhimg.com/v2-28b3f0495b89deec8fa7148072d762af_r.jpg)




### 8.4 穿透EasyNVR的WebUI界面

点击左侧菜单栏的`隧道管理`，展开进入`隧道列表`页面，页面下默认会有 2 个隧道：

- ssh隧道，指向22端口，tcp协议
- website隧道，指向8080端口，http协议（http协议默认会生成2个公网地址，一个是http，另一个https，免去配置ssl证书的繁琐步骤）




![](https://pic1.zhimg.com/v2-08b7a3cb2bdda5440af541d71f1af578_r.jpg)




点击编辑`website`的隧道，这里设置名称为`easynvr`方便辨识，然后本地地址填写`10000端口`系统的访问地址，地区这里选择的`China Top`，然后点击更新：




![](https://picx.zhimg.com/v2-9041972468a372d9fd745856ae04a705_r.jpg)




接着，点击左侧菜单的`状态`菜单，接着点击`在线隧道列表`菜单按钮，可以看到有2个`easynvr`的隧道，一个为http协议,另一个为https协议:




![](https://picx.zhimg.com/v2-87333cd81a2054ad4b7264d164bdebbd_r.jpg)




接下来在浏览器中访问`easynvr`隧道生成的公网地址，这里以https为例：




![](https://pic4.zhimg.com/v2-ecf5291810cd440f164debe5da101ebd_r.jpg)




可以看到成功的访问到EasyNVR的页面啦！不过随机域名方式适合**预算有限** 的用户。使用此方式时，系统会每隔 **24 小时**  左右自动更换一次域名地址。对于长期访问的不太友好，但是该方案是**免费** 的，如果您有一定的预算，可以查看**固定域名方式** ，且**访问更稳定** 哦。

## 9 固定二级子域名

随机域名虽然免费，但**每 24 小时左右会自动更换一次** ，每次变化都要重新记地址、重新分享链接，用起来确实不太方便。如果你希望拥有一个**固定不变、简短易记的专属域名** ，只需升级 cpolar 任意付费套餐，即可配置**固定二级子域名** ，彻底告别域名频繁变化的烦恼。下面我们来看看如何操作。

首先，进入官网的预留页面：

```text
https://dashboard.cpolar.com/reserved
```

然后，选择**预留** 菜单，即可看到**保留二级子域名** 项，填写其中的**地区、名称、描述（可不填）** 项，然后点击**保留** 按钮，操作步骤图如下：




![](https://picx.zhimg.com/v2-a5784e44c3e3523485e2ed343612114f_r.jpg)




列表中显示了一条已保留的二级子域名记录：

- **地区** ：显示为**China Top** 。
- **二级域名** ：显示为**easynvr** 。

**注：二级域名是唯一的，每个账号都不相同，请以自己设置的二级域名保留的为主** 

接着，进入侧边菜单栏的`隧道管理`下的`隧道列表`，可以看到名为`easynvr`的隧道：




![](https://pic3.zhimg.com/v2-68f9c2cc53758c1b1721ed6fd646081e_r.jpg)




点击`编辑`按钮进入编辑页面，修改域名类型为`二级子域名`，然后填写前面配置好的子域名，点击更新按钮：




![](https://picx.zhimg.com/v2-fc8e028f4f8bb3780edc7a01b4136731_r.jpg)




接着来到`状态`菜单下的`在线隧道列表`可以看到隧道名称为`easynvr`的公网地址已经变更为`二级子域名+固定域名主体及后缀`的形式了：




![](https://pic2.zhimg.com/v2-1cc0b5cc553a8d2c9ade76004ad96e41_r.jpg)




这里以https访问测试一下：




![](https://pic2.zhimg.com/v2-6bcfd9c33042c5f786a15d4bc73f8041_r.jpg)




访问成功，让我们再进行登录测试一下： 

![](https://pic3.zhimg.com/v2-03b78cb0efce0df932943461ffe459b6_r.jpg)




成功登录！以后你不管是去公司上班，还是外出旅游，都可以通过这个固定的公网地址，随时随地打开 EasyNVR，不仅能实时查看家里的情况，还能随意回放之前的录像。而且，这个地址是**永久固定** 的，不用再担心过段时间就变了，是不是超级方便！

## 总结

通过本文的完整教程，你已经成功实现了**小米摄像头** 的本地化存储方案。相比往期的**Micam三件套** 方案，本次的**Go2RTC+EasyNVR双容器** 方案在性能和易用性上都有了显著提升，真正做到了从"云存储依赖"到"完全自主"的技术跨越。

这套方案的突出优势体现在：

- **容器数量减少** ：从4个容器精简到2个，**内存占用大幅降低** 
- **部署更简单** ：Go2RTC单容器即可完成流媒体转换，无需复杂的转发服务
- **性能更稳定** ：在N1盒子等低配设备上也能流畅运行

现在，你的家用摄像头已经成功升级为专业的安防监控系统，每一秒录像都安安稳稳地躺在你自己的硬盘里。告别被平台"割韭菜"，真正掌握数据的"生杀大权"！

