---
title: "Redis"
tags: ["数据库"]
date: "2026-06-01T08:00"
summary: "B站Redis笔记  BV1Jj411D7oG"
cover: ""
hidden: false
category: "数据库"
---

# 一.数据结构类型
## 1.字符串
```sql
# Set 设置
set name yyk

# Get 获取
get name 

# Del 删除
del name

# exists 是否存在
exists name

# keys 获取所有key
keys *

# flushall 删除全部key
flushall 

# expire 定义生命周期
expire name 10

# setex 定义键值时设置生命周期
setex name 10 yyk

# setnx 如果键不存在则定义
setnx name 10
```

## 2.列表 List
```sql
# lpush 左创建
lpush list  a b c 

# rpush 右创建
rpush list d

# lpop/rpop 左/右删除 范围
lpop list 1
rpop list 1

# lrange 查看列表（所有）元素
lrange list 0 -1

# llen 查看列表长度
llen list

# ltrim  裁剪序号1-3以为的值
ltrim list 1 3
```

## 3.无序集合 Set
```bash
# sadd 定义一个Set
sadd course redis

# smembers 查看键值
smembers course

# sismerber 键值是否存在
sismerber course redis

# srem 删除值
srem course redis

# sinter 交集

# sunion 并集

# sdiff 差集

```


## 4.有序集合 Zset
每个元素关联一个浮点类型的分数，然后从小到大排序，<font color="#ff0000">元素唯一，分数不唯一</font>
```sql
# zadd 添加并设置浮点数和值
zadd result 680 ykk 650 yzq 630 lys

# zrange 查看所有键值/并是否添加浮点数
zrange result 0 -1
zrange result 0 -1  withscores

# zscore 查看值的浮点数
zscore result yyk

# zrem  删除值
zrem result yzq

# zrank 查看值的排序序号
zrank result yyk

# zrevrank  反向排序
zrevrank result yyk
```

## 5.哈希 Hash
键值对集合
```sql
# hset 设置键值对
hset person name yyk age 21

# hget 查看键的值
hget person name
hget person age

# hgetall 查看所有键值对
hgetall person

# hdel 删除一个键值对
hdel person age

# hexists 查看这个键值对是否存在
hexists person age

# hkeys  查看一个集合里所有的键
hkeys person
# hlen
hlen person 查看一个集合的长度
```




# 二.持久化
数据只存在内存中，肯定会丢失，实现持久化，就需要把数据存储到磁盘中
## 1.RDB 
###  自动备份
配置文件默认开启，根据写入频率从而触发
```bash
save 900 1				=>  15分钟内最少有1个key改变
save 300 100	     =>  5分钟内最少有100个key改变
save 60	 10000		=>  1分钟内最少有10000个key改变
```

### 手动备份
```bash
save

bgsave
```

### 快照文件存放
```bash
127.0.0.1:6379> CONFIG GET dir
1) "dir"
2) "/root/redis-7.4.0"   #这个就为快照的存放处
```

### 优劣势
<font color="#ff0000">RDB 文件非常适合备份</font>。 可以设置定时任务对数据库进行快照

缺点：
1. 需要在一定间隔时间做一次备份，所以如果 Redis 意外 down 掉的话，就<font color="#ff0000">会丢失从当前至最近一次快照期间</font>

2. 内存数据的<font color="#ff0000">全量同步</font>，如果<font color="#ff0000">数据量太大会导致 I/O 严重影响服务器性能</font>

3. <font color="#ff0000">备份时不能处理其他命令</font>，如果使用子进程 fork，量太多也会导致性能问题
## 2.AOF
持久化记录服务器接收到的每个<font color="#ff0000">写操作</font>。这些操作可以在服务器<font color="#ff0000">启动时重播</font>，重建原始数据集。
### 配置
开启
```powershell
1399行：appendonly yes
```

设置备份频率
```powershell
1458行：appendfsync everysec
```


**Redis 7：**
`redis.conf` 配置文件中除了要设置 dir 以外，还新增加了一属性 `appenddirname` 。

AOF 保存文件的位置：dir + appenddirname

```powershell
vim redis.conf
dir /usr/local/redis/
appendfilename "appendonly.aof"
appenddirname "appendonlydir"

# ll /usr/local/redis/appendonlydir
# 记得重启redis
pkill redis-server
bin/redis-server conf/redis.conf
```



# 三.主从复制
## 单机演示
### 复制配置文件到根目录
```bash
cp ./redis.conf /
cp redis.conf redis-6380.conf
```

### 配置 6380 配置文件
```bash
#139行 端口
port 6380

#342 pid文件
pidfile /var/run/redis_6380.pid

#493 备份文件
dbfilename dump-6380.rdb

#540 配置主节点ip和端口
replicaof 127.0.0.1 6379
```

### 启动 6380 并连接
```bash
redis-server redis-6380.conf


redis-cli -p 6380

info replication
# Replication
role:slave
master_host:127.0.0.1
master_port:6379
master_link_status:up

```

### 测试
主节点
```bash
127.0.0.1:6379> keys *
1) "result"
2) "list"
3) "geekhour"
4) "person"
5) "geek"

127.0.0.1:6379> set k4 v4
OK

```

从节点
```bash
127.0.0.1:6380> keys *
1) "person"
2) "geek"
3) "geekhour"
4) "result"
5) "list"


127.0.0.1:6380> keys *
1) "person"
2) "geek"
3) "k4"
4) "geekhour"
5) "result"
6) "list"

```




# 四.哨兵模式
## 编辑 Sentinel 文件

```bash
vi redis-sentinel sentinel.conf
	sentinel monitor master 127.0.0.1 6379 1

redis-sentinel sentinel.conf
```

![image.png](https://image.2131245.xyz/file/1780294742249_image.png)


## 测试
关闭主节点服务 6379
```bash
#主节点信息
127.0.0.1:6379> info replication
# Replication
role:master
connected_slaves:2

#关闭
redis-cli -p 6379 shutdown
```

从节点 6381查看
```bash
127.0.0.1:6381> info replication
# Replication
role:slave
master_host:127.0.0.1
master_port:6379

#由从变为了主
127.0.0.1:6381> info replication
Error: Server closed the connection
not connected> info replication
# Replication
role:master
connected_slaves:1

```

从节点 6380 查看
```bash
#master从6379变为了6381

not connected> info replication
# Replication
role:slave
master_host:127.0.0.1
master_port:6381

```