---
title: " Redis"
tags:
  - 数据库
date: 2026-05-29
summary: B站Redis笔记
cover: ""
hidden: false
category: 数据库
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




