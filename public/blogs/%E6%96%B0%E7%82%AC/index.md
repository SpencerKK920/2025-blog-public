---
title: "新炬-Orecle安装及Mysql主从复制搭建"
tags: ["数据库", "面试"]
date: "2026-05-31T08:00"
summary: "Orecle安装及Mysql主从复制搭建"
cover: ""
hidden: false
category: "数据库"
---


# 一.安装 Vm ware 虚拟机软件

## 1.进入官网进行下载

[https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion](https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion)
![image.png](https://image.2131245.xyz/file/1780216687329_image.png)
## 2.点击下载，跳转新网页注册登录，然后下载

[https://support.broadcom.com/group/ecx/productdownloads?subfamily=VMware%20Workstation%20Pro&freeDownloads=true](https://support.broadcom.com/group/ecx/productdownloads?subfamily=VMware%20Workstation%20Pro&freeDownloads=true) 选择对应版本

![image.png](https://image.2131245.xyz/file/1780216765733_image.png)
## 3.下载之后得到一个安装包，点击安装

这是我之前下载的一个安装包演示
![image.png](https://image.2131245.xyz/file/1780216805810_image.png)

## 4.安装完成后进入主页

![image.png](https://image.2131245.xyz/file/1780216824346_image.png)

# 二. 安装虚拟机

## 1.初始配置

这里我用 Centos 9 演示
因为软件最高只有 C 8 所以版本选择 c 8
在最后选择 ISO，点击完成创建
![image.png](https://image.2131245.xyz/file/1780216920815_image.png)

## 2.系统配置

设置 root 密码，开始安装
![image.png](https://image.2131245.xyz/file/1780217014939_image.png)

# 三.服务配置

## 1.配置网络

进入 终端配置 ip，并重启
![image.png](https://image.2131245.xyz/file/1780217076481_image.png)
使用终端工具 SSH 登录系统

![image.png](https://image.2131245.xyz/file/1780217115064_image.png)
## 2.安装 Orecle

### 2.1 安装 Java 16

![image.png](https://image.2131245.xyz/file/1780217162009_image.png)

### 2.2 配置环境

#### 创建和用户用户组
```bash
[root@localhost ~]# groupadd oinstall #创建oinstall组
[root@localhost ~]# groupadd dba　　#创建dba组
[root@localhost ~]# useradd -g oinstall -G dba -m oracle  #创建oracle用户并将用户加入到dba组与oinstall组
[root@localhost ~]# passwd oracle #设置oracle用户密码,非必要
```

#### 配置内核参数

![image.png](https://image.2131245.xyz/file/1780217259941_image.png)

#### 限制用户

![image.png](https://image.2131245.xyz/file/1780217279093_image.png)

#### 设置用户变量
![image.png](https://image.2131245.xyz/file/1780217315709_image.png)


#### 修改安装响应文件

vi response/db_install.rsp

```
29 oracle.install.option=INSTALL_DB_SWONLY  #安装选项
37 ORACLE_HOSTNAME=centos7    #命令hostname查看
42 UNIX_GROUP_NAME=oinstall    #主组
49 INVENTORY_LOCATION=/data/oraInventory
86 SELECTED_LANGUAGES=en,zh_CN 
91 ORACLE_HOME=/data/oracle/product/11.2.0/db_1
96 ORACLE_BASE=/data/oracle
107 oracle.install.db.InstallEdition=EE    #版本
117 oracle.install.db.isCustomInstall=true
154 oracle.install.db.DBA_GROUP=dba   #admin管理组名
160 oracle.install.db.OPER_GROUP=dba   #oper操作员组名
189 oracle.install.db.config.starterdb.type=GENERAL_PURPOSE
199 oracle.install.db.config.starterdb.SID=orcl
229 oracle.install.db.config.starterdb.memoryLimit=800      #根据自己设定的物理内存设置，一般为物理内存的40%-60%
262 oracle.install.db.config.starterdb.password.ALL=123456   #设置所有用户密码，方便后面更改。
400 DECLINE_SECURITY_UPDATES=true
 
```

### 2.3 静默安装
![image.png](https://image.2131245.xyz/file/1780217385388_image.png)

### 2.4 配置监听器
![image.png](https://image.2131245.xyz/file/1780217448139_image.png)

启用 
![image.png](https://image.2131245.xyz/file/1780217467463_image.png)

#### 查看状态监听

![image.png](https://image.2131245.xyz/file/1780217757502_image.png)

#### 2.5 创建库

```
dbca -silent -createDatabase \
-templateName General_Purpose.dbc \
-gdbName orcl \
-sid orcl \
-responseFile NO_VALUE \
-characterSet AL32UTF8 \
-nationalCharacterSet AL16UTF16 \
-memoryPercentage 40 \
-emConfiguration NONE
```
![image.png](https://image.2131245.xyz/file/1780217718552_image.png)
进入数据库，并创建一个用户
![image.png](https://image.2131245.xyz/file/1780218013741_image.png)

查看当前库信息 
![image.png](https://image.2131245.xyz/file/1780218047737_image.png)

# 四.Mysql 主从配置

## 1.环境准备

| 主机名      | IP              | 备注      | 软件环境 |
| -------- | --------------- | ------- | ---- |
| mysql 01 | 192.168.159.137 | 主要要点/写  | java |
| mysql 02 | 192.168.159.142 | 备用节点/读  | java |
| mycat 2  | 192.168.159.141 | Mycat 2 | java |


## 2.配置 Mycat

### 2.1 配置 `prototypeDs.datasource.json` 文件

![image.png](https://image.2131245.xyz/file/1780218197112_image.png)

### 2.2 配置数据源

连接 DataGrip 创建数据 db 1，并生成 db 1.schema.json 文件
添加数据源

```
-- 创建一个主数据库连接（负责读写分离中的写操作）
/*+ mycat:createDataSource{
"name":"rwSepw",
"url":"jdbc:mysql://192.168.159.137:3306/db1?useSSL=false&characterEncoding=UTF-8&useJDBCCompliantTimezoneShift=true",
"user":"root",
"password":"123"
} */;

-- 创建一个从数据库连接（负责读写分离中的读操作）
/*+ mycat:createDataSource{
"name":"rwSepr",
"url":"jdbc:mysql://192.168.159.141:3306/db1?useSSL=false&characterEncoding=UTF-8&useJDBCCompliantTimezoneShift=true",
"user":"root",
"password":"123"
} */;

/*+ mycat:showDataSources{} */;
```

添加资源

```
/*! mycat:createCluster{"name":"prototype","masters":["rwSepw"],"replicas":["rwSepr"]} */;
/*+ mycat:showClusters{} */;
```

重新启动 mycat

## 3.测试读写

### 写测试

通过 DataGrip 创建数据表，并通过内置变量插入表数据，显示当前主机名为 mysql 01
![image.png](https://image.2131245.xyz/file/1780218573926_image.png)
### 读测试

直接在 mysql 2 上插入数据，设置数据和 mysql 1 数据区分开来，当读取的时候有第二条数据代表读取测试成功
![image.png](https://image.2131245.xyz/file/1780218653754_image.png)

第一次读取有第二条数据
![image.png](https://image.2131245.xyz/file/1780218668509_image.png)

第二次读取没有第二条数据，代表读轮询策略成功
![image.png](https://image.2131245.xyz/file/1780218679732_image.png)