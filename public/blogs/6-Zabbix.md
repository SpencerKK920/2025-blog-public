---
title: " Zabbix"
tags:
  - Linux
  - 监控
date: 2026-06-07
summary: Zabbix安装到监控
cover: ""
hidden: false
category: Linux
---

# 一.部署
## 安装 Mysql 8.0 （服务端）
解压 MySQL

```powershell
mkdir /root/mysql
tar -xf mysql-8.0.37-1.el9.x86_64.rpm-bundle.tar -C /root/mysql
```

安装 MySQL

```powershell
cd /root/mysql
rpm -ivh mysql-community-* --force --nodeps

```

第四步：启动 MySQL，并开机启动

```powershell
#启动MySQL
systemctl start mysqld
 
#MySQL加入开启自启
systemctl enable mysqld
```

第五步：查看初始密码

```powershell
#查询初始密码
cat /var/log/mysqld.log | grep password
A7AmpRMLGw!g
```

第六步：修改密码

如果你想要设置简单的密码，你需要先更换一个初始密码，然后再修改策略，再修改简单密码，所以先使用一个复杂的密码作为新密码。【注意：数据库中输入的指令注意“；”这个符合别漏掉】

```powershell
mysql -uroot -p
Enter password:输入初始密码
 
# 使用root登入mysql，密码使用使用上方查询出来的密码→修改密码为Xa%^3T%T4!
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'Xa%^3T%T4!';
 
# 设置密码检查等级
mysql> set global validate_password.policy=0;
 
# 0 (或LOW)：允许密码包含最简单的密码（只包含小写字母、数字、特殊字符中的一类）。
# 1 (或MEDIUM)：要求密码至少包含小写字母、大写字母、数字、特殊字符中的三类。
# 2 (或STRONG)：要求密码至少包含小写字母、大写字母、数字、特殊字符中的四类。
 
# 密码的最短长度
mysql> set global validate_password.length=5;
 
# 密码至少要包含的小写字母个数和大写字母个数
mysql> set global validate_password.mixed_case_count=0;
 
# 再次修改密码为qwe!123，并退出数据库
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'qwe!123';
 
# 退出
mysql> exit
```


## 安装 PHP （服务端）
第一步：加载 remi 库

```powershell
sudo dnf install -y https://rpms.remirepo.net/enterprise/remi-release-9.rpm
```

安装完成后，重建缓存

```powershell
#清除dnf的缓存【如RPM软件包文件、旧的headers和元数据（元数据描述了可用的软件包和它们的依赖关系）、dnf生成的其他临时文件】
dnf clean all 
 
#下载并缓存元数据
dnf makecache
```

第二步：安装 PHP 8 和其相关的组件

```powershell
#下面是Zabbix server在使用PHP时需要用到的PHP相关组件的安装：
sudo dnf install -y php80 php80-php-cli php80-php-gd php80-php-json php80-php-mbstring php80-php-mysqlnd php80-php-xml
```

## 安装 Zabbix

第一步：加载 zabbix 软件库

```powershell
rpm -Uvh https://repo.zabbix.com/zabbix/7.0/alma/9/x86_64/zabbix-release-7.0-2.el9.noarch.rpm
简单理解就是加载了zabbix官方的应用商店
```

第二步：关闭无关的库

进入软件库文件夹/etc/yum.repos.d/打开 epel.repo 文件
`enabled = 1改成enabled = 0`

第三步：安装 zabbix 所需组件

```powershell
dnf install -y zabbix-server-mysql zabbix-web-mysql zabbix-apache-conf zabbix-sql-scripts zabbix-selinux-policy zabbix-agent
```

第四步：重新启用 epel.repo

## 配置 Zabbix 数据库

第一步：创建数据库

```powershell
#进入数据库
mysql -uroot -p
 
#创建了一个名为zabbix_proxy的新数据库，该数据库使用utf8mb4字符集和utf8mb4_bin校对规则，这使得它特别适合于存储包含特殊字符（如emoji）的数据，并且以二进制方式比较和排序字符串。

create database zabbix character set utf8mb4 collate utf8mb4_bin;

```

第二步：设置密码并授权

```powershell
#创建一个数据库访问账号zabbix，密码为qwe!123
create user zabbix@localhost identified by 'qwe!123';
 
#授予用户 zabbix 在 zabbix 数据库上所有权限，并且这个权限仅适用于从 localhost 主机连接到 MySQL 服务器的用户。
grant all privileges on zabbix.* to zabbix@localhost;

授予权限：用户 zabbix 将获得在 zabbix 数据库上执行任何操作的能力，包括创建表、删除表、插入数据、更新数据、查询数据等。

指定数据库：这里的 zabbix.* 表示 zabbix 数据库中的所有对象（表、视图、存储过程等）。

指定用户：zabbix@localhost 表示用户名为 zabbix 的用户，并且这个用户只能从 localhost 连接到 MySQL 服务器。localhost 通常指的是 MySQL 服务器所在的机器。

权限范围：这个权限仅限于zabbix数据库，不影响其他数据库。
```

第三步：临时降低安全性

```powershell
#告诉 MySQL 信任你，即使你正在创建或修改一个非确定性函数，你也知道如何确保主服务器和从服务器之间的数据一致性。为了防止后面导入初始数据库时会出现报错，所以临时降低安全性。
set global log_bin_trust_function_creators = 1;
 
#退出
quit;
```



第四步：导入数据库

```powershell
#导入zabbixd的初始数据库
zcat /usr/share/zabbix-sql-scripts/mysql/server.sql.gz | mysql --default-character-set=utf8mb4 -uzabbix -p zabbix
 
Enter password:输入之前设置zabbix访问数据库的密码
```

官方提供的命令行，大致意思是读取 `/usr/share/zabbix-sql-scripts/mysql/server.sql.gz` 文件（Zabbix 的 MySQL 初始化脚本）的内容，并将其直接导入到名为 `zabbix` 的 MySQL 数据库中，使用 `zabbix` 用户名和提示输入的密码进行身份验证，并确保在数据传输过程中使用 `utf8mb4` 字符集。

```powershell
#关闭修改非确定性函数
mysql -uroot -p

set global log_bin_trust_function_creators = 0;
quit;
```

## 配置 conf 文件

修改 zabbix 应用程序的配置文件/etc/zabbix/中的 zabbix_server.conf 数据库密码和监听端口参数，找个空白处输入进去即可。

```powershell
vim /etc/zabbix/zabbix_server.conf
#设置数据库密码位上方设置的zabbix密码qwe!123：
DBPassword=123456
 
#设置监听客户端端口位10051：
ListenPort=10051
```

## 开启端口与服务

如果生产环境，可以参考如下规则设置防火墙：

```powershell
# 查看80端口状态，NO表示没打开，YES表示打开。
[root@localhost ~]# firewall-cmd --zone=public --query-port=80/tcp
 
#开启80、10050、10051端口，重启依然生效
[root@localhost ~]# firewall-cmd --zone=public --add-port=80/tcp --permanent
[root@localhost ~]# firewall-cmd --zone=public --add-port=10050/tcp --permanent
[root@localhost ~]# firewall-cmd --zone=public --add-port=10051/tcp --permanent
 
# 重新加载防火墙配置，立即生效
[root@localhost ~]#firewall-cmd –reload
```

重启服务

```powershell
#重新启动zabbix-server、zabbix-agent、httpd、php-fpm服务
systemctl restart zabbix-server zabbix-agent httpd php-fpm
 
#加入开机自动启动
systemctl enable zabbix-server zabbix-agent httpd php-fpm

```

## Web 配置


第一步：打开浏览器，输入“[http://IP/zabbix/](http://ip/zabbix/)”进行访问（IP 指的是服务器的 IP 地址），会自动跳转到配置页面，选择中文，点击下一步。

![image.png](https://image.2131245.xyz/file/1780836090318_image.png)

第二步：他会检测 PHP 的参数是否配置正确上面没有配置错误的话一般都是正常的，如果有问题就到/etc/php.ini 修改这个文件的参数即可。

![image.png](https://image.2131245.xyz/file/1780836121117_image.png)

第三步：输入 zabbix 用户访问数据库的密码，然后下一步

![image.png](https://image.2131245.xyz/file/1780836143471_image.png)

第四步：设置主机名（自己设置即可），我喜欢暗色，所以主题选了暗色，你们自行选择，然后直接下一步到完成。

![image.png](https://image.2131245.xyz/file/1780836151725_image.png)

单击下一步，下一步，出现如下界面，代表安装完成：

![image.png](https://image.2131245.xyz/file/1780836160188_image.png)

第五步：登录 Zabbix，默认账号：Admin（注意首字母大写），密码：zabbix

![image.png](https://image.2131245.xyz/file/1780836171618_image.png)

登录后，如下图所示：

![image.png](https://image.2131245.xyz/file/1780836182952_image.png)



# 二.监控服务器
## 1.agent 1 上安装 zabbix-agent

~~~powershell
rpm -Uvh https://repo.zabbix.com/zabbix/7.0/alma/9/x86_64/zabbix-release-7.0-2.el9.noarch.rpm

dnf install zabbix-agent -y

注：如果/etc/yum.repos.d目录存在epel.repo，必须先把epel.repo关闭，然后安装完成后在启用！！！
~~~

## 2.配置 agent 端并启动服务

配置 `/etc/zabbix_agentd.conf` 配置文件，配置结果如下:

~~~powershell
egrep -vn '^#|^$' /etc/zabbix_agentd.conf
13:PidFile=/var/run/zabbix/zabbix_agentd.pid
32:LogFile=/var/log/zabbix/zabbix_agentd.log
43:LogFileSize=0
117:Server=192.168.159.128					    修改成zabbix监控服务器的IP,agent被动模式
171:ServerActive=192.168.159.128		  修改成zabbix监控服务器的IP,agent主动模式
182:Hostname=node2								   修改为被监控端的主机名
~~~

~~~powershell
systemctl restart zabbix-agent
systemctl enable zabbix-agent

netstat -ntlup |grep :10050
tcp    0   0 0.0.0.0:10050        0.0.0.0:*        LISTEN      7413/zabbix_agentd
tcp6   0   0 :::10050             :::*             LISTEN      7413/zabbix_agentd
~~~

## 3.web 管理界面创建监控主机

回到 web 管理界面－－》点监测－－》点主机 －－》 点创建主机

![image.png](https://image.2131245.xyz/file/1780836408034_image.png)

设置主机名称、主机群组以及接口信息

![image.png](https://image.2131245.xyz/file/1780834869117_image.png)

选择模板信息，如下图所示：

![image.png](https://image.2131245.xyz/file/1780836431944_image.png)



## 4.确认监控 OK

![image.png](https://image.2131245.xyz/file/1780836458891_image.png)



# 三.模板

## 模板介绍与作用

**==使用模板可以方便应用到主机，更改模板也会将更改应用到所有链接的主机==**。

server、agent 1、agent 2：公用一个 Linux by Zabbix Agent，如果更改了这个模板，则所有主机监控项也会随之改变！

例: 比如我要把监控 nginx 相关的全部做成一个模板，有 100 台服务器需要监控 nginx，我只需要链接模板到这 100 台机器即可。以后需要修改，只需要修改模板，这 100 台就会被同时修改。


## 为主机添加或删除模板


![image.png](https://image.2131245.xyz/file/1780836703979_image.png)

![image.png](https://image.2131245.xyz/file/1780836733093_image.png)



## 创建自定义模板

数据采集->模板->创建模板：



![image.png](https://image.2131245.xyz/file/1780836776764_image.png)

![image.png](https://image.2131245.xyz/file/1780836788742_image.png)


# 四.监控项与应用集

**监控项(item)**: 是从主机收集的数据信息,代表收集数据或监控的一个**最小单位**。

比如 cpu 1 分钟内平均负载,内存空闲值,磁盘使用率等等都可以做为监控项，可以说监控项有无限种可能。

**应用集(applications)**: 代表多个监控项目合成的组。



## 创建监控项的方式

创建监控项的方法有 2 种:

1. 在某一台被监控机上创建(如下图所示)，这样创建的监控项只对此监控机生效。

![image.png](https://image.2131245.xyz/file/1780836846147_image.png)

2. 在模板里创建(如下图所示), 这样创建的监控项对所有使用此模板的主机生效(**推荐方式**)。

![image.png](https://image.2131245.xyz/file/1780836865472_image.png)


## 创建自带键值监控项

创建监控项中最核心的概念就是**==键值(key)==**。

**键值就看作是开发好的用于收集数据的命令**，主要有两种:

- **zabbix 自带的键值**(太多了,不用特意去记忆)
- **自定义开发的键值**(用 linux 基础命令就可以开发)



### 1.在模板里创建监控项

![image.png](https://image.2131245.xyz/file/1780836865472_image.png)


### 2.填写监控项相关信息

https://www.zabbix.com/documentation/7.0/zh/manual/config/items/itemtypes/zabbix_agent

![image.png](https://image.2131245.xyz/file/1780836937351_image.png)

![image.png](https://image.2131245.xyz/file/1780836948706_image.png)

### 3. 确认创建成功

![image.png](https://image.2131245.xyz/file/1780836968219_image.png)

![image.png](https://image.2131245.xyz/file/1780836971992_image.png)




# 五.触发器

虽然我们可以通过图形查看到监控的数据，但我们不可能一直盯着图形的变化。

所以需要定义监控项到达一个临界值(阈值)或者满足一个条件，就会发生状态变化的通知。

定义**触发器(trigger)**就是定义这个临界值(阈值)或条件.


## 创建登录用户数过多的触发器

### 1. 在模板里创建触发器

![image.png](https://image.2131245.xyz/file/1780835618987_image.png)

![image.png](https://image.2131245.xyz/file/1780835717638_image.png)

### 2.配置触发器

![image.png](https://image.2131245.xyz/file/1780837250130_image.png)



![image.png](https://image.2131245.xyz/file/1780837262914_image.png)

![image.png](https://image.2131245.xyz/file/1780837271917_image.png)

### 3.验证创建成功

![image.png](https://image.2131245.xyz/file/1780837225660_image.png)

![image.png](https://image.2131245.xyz/file/1780837237824_image.png)

### 4.验证触发器效果

先在 agent 1 上再多打开几个终端，将登录用户数控制在 20 个以上(操作过程省略)

然后通过下图查看触发器通知

![image.png](https://image.2131245.xyz/file/1780837275142_image.png)



![image.png](https://image.2131245.xyz/file/1780837281862_image.png)
