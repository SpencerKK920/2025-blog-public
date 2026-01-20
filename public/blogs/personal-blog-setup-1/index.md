#  一.进入源项目Github创建分支

源链：https://github.com/YYsuni/2025-blog-public
![](/blogs/博客搭建（一）/df6a132edace504f.png)


#  二.部署到Vercel

个人界面：https://vercel.com/spencers-projects-f7a1bcc4

## 1.点击添加项目
![](/blogs/博客搭建（一）/6fec8a647002dcc1.png)


## 2.选择项目开始构建
![](/blogs/博客搭建（一）/daff8dc8b0fb5156.png)


# 三.进入域名服务商购买域名

spaceship:https://www.spaceship.com/zh/application/advanced-dns-application/manage/2131245.xyz/

![](/blogs/博客搭建（一）/e4e47075f5cccdd1.png)



# 四.进入cloudflare

https://dash.cloudflare.com/8e1cdbe4b01fce162e0fbfc8a7027aa2/domains/overview

## 1.添加域名并使用免费计划

![](/blogs/博客搭建（一）/a11721814895a65c.png)

## 2.在space里更改名称服务器使其让cf代理

![](/blogs/博客搭建（一）/94bb82224f1a8e3e.png)

## 3.配置好DNS和SSL证书

![](/blogs/博客搭建（一）/a020e85d5f33ee60.png)
![](/blogs/博客搭建（一）/4bbef26abea8d0f0.png)
# 五.在Velcel里配置好自己的域名

![](/blogs/博客搭建（一）/3ec371aab1179de7.png)

# 六.创建环境变量和GitHub应用实现更改网站的私钥认证方式

## 1.创建Github应用生成私钥和appid

进入设置在最下面的开发者选项中进入应用界面并创建一个应用程序
![](/blogs/博客搭建（一）/5332feae7e7f15de.png)


进入开发者页面，点击**New Github App**

*GitHub 应用名称*和*主页 URL*，输入什么都不影响。Webhook 也关闭，不需要。

[![img](https://camo.githubusercontent.com/137d96b0f4a166db776b1a98a81b5cf8e3e3b9d7abe4689d84177fc79888b83e/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f373164636439636638656339363763302e706e67)](https://camo.githubusercontent.com/137d96b0f4a166db776b1a98a81b5cf8e3e3b9d7abe4689d84177fc79888b83e/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f373164636439636638656339363763302e706e67)

要注意设置一个仓库写权限，其他不用。

[![img](https://camo.githubusercontent.com/4ff6e3f367b43e647621790b6604cf4b88e1f69bc6d8a8826af80098ca969f88/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f326265323930303136653536636433342e706e67)](https://camo.githubusercontent.com/4ff6e3f367b43e647621790b6604cf4b88e1f69bc6d8a8826af80098ca969f88/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f326265323930303136653536636433342e706e67)

点击创建，谁能安装这个仓库这个选择无所谓。直接创建。

[![img](https://camo.githubusercontent.com/48db18b53abd40455c111ce73d3ce03ac29a50826e170fc0a3500ab40b71122a/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f616130303265363830356162326436352e706e67)](https://camo.githubusercontent.com/48db18b53abd40455c111ce73d3ce03ac29a50826e170fc0a3500ab40b71122a/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f616130303265363830356162326436352e706e67)

### 创建密钥



创建好Github App后会提示必须创建一个**Private Key**，直接创建，会自动下载（不见了也不要紧，后面自己再创建再下载就行）。页面上有个**App ID**需要复制一下

重新切换到安装页面

[![img](https://camo.githubusercontent.com/3423b05ccc14b9eddd32ce1936832b13d53e0dad45cf33897299d6e5ae2c1e57/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f633132326231353835626237613436612e706e67)](https://camo.githubusercontent.com/3423b05ccc14b9eddd32ce1936832b13d53e0dad45cf33897299d6e5ae2c1e57/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f633132326231353835626237613436612e706e67)

这里一定要只**授权当前项目**。

[![img](https://camo.githubusercontent.com/b7714a57753601e6b2085e6f2c4805acaae23612e0e8b400bc2cbe70108b0978/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f326366316365653362303433323666312e706e67)](https://camo.githubusercontent.com/b7714a57753601e6b2085e6f2c4805acaae23612e0e8b400bc2cbe70108b0978/68747470733a2f2f7777772e797973756e692e636f6d2f626c6f67732f726561646d652f326366316365653362303433323666312e706e67)



## 2.Vercel里创建环境变量

NEXT_PUBLIC_GITHUB_APP_ID     值为应用id

NEXT_PUBLIC_GITHUB_OWNER   所属主
![](/blogs/博客搭建（一）/50ae31b057d8c147.png)
