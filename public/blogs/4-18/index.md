# Jenkins pipeline流水线

# Pipeline介绍

## 什么是 Jenkins Pipeline?

- **Pipeline** 是 Jenkins 的“自动化流程脚本”，用代码描述整个软件交付生命周期，如拉取代码、编译、测试、部署、发布等流程，实现标准化、自动化、一键上线。

  Pipeline 的定义文件通常叫做 `Jenkinsfile`，可以和源码一起维护。

## Jenkins Pipeline优势

**一切皆代码**：流程、环境、步骤全部用代码描述，易回溯、可追溯、团队协作方便。

**可视化**：自动生成流程图，方便运维与开发查看流程。

**标准化与复用**：企业统一规范、减少人工失误。

# Jenkins Pipeline 基本语法

## 两种主要语法

- **声明式（Declarative）**：推荐，结构化、层级清晰，易读易维护。
- **脚本式（Scripted）**：自由度高，用Groovy语法，适合复杂逻辑或老项目。

https://www.jenkins.io/zh/doc/book/pipeline/

## 声明式语法

就像写菜单、列流程表，**格式严谨、简单明了，结构像“包裹套娃”**。

```powershell
pipeline {
    agent any   // 在任何Jenkins节点执行
    stages {
        stage('第一步：拉代码') {
            steps {
                echo '拉取代码'
            }
        }
        stage('第二步：编译') {
            steps {
                echo '编译代码'
            }
        }
        stage('第三步：部署') {
            steps {
                echo '部署到服务器'
            }
        }
    }
}
```

**重点记住：**

- `pipeline {}` 最外层
- 里面是 `stages {}`，一堆 `stage {}`，每个stage就是一个步骤
- 每个`stage`下都有`steps`，里面是要执行的命令

## 脚本式语法

更像写脚本、写程序，**格式自由，控制更灵活**。

```powershell
node {
    stage('拉代码') {
        echo '拉取代码'
    }
    stage('编译') {
        echo '编译代码'
    }
    stage('部署') {
        echo '部署到服务器'
    }
}
```

**重点记住：**

- `node {}` 是最外层
- 里面直接写 `stage('步骤名')`，每个stage写一步要做的事
- 想加if判断、循环、try-catch等复杂逻辑都可以直接写

## 两种写法对比

| 目的     | 声明式写法                  | 脚本式写法             |
| -------- | --------------------------- | ---------------------- |
| 拉代码   | `stage('拉代码'){...}`      | `stage('拉代码'){...}` |
| 编译     | `stage('编译'){...}`        | `stage('编译'){...}`   |
| 部署     | `stage('部署'){...}`        | `stage('部署'){...}`   |
| 外层包裹 | `pipeline {}` + `stages {}` | `node {}`              |
| 格式     | 结构化、标准、易看懂        | 脚本风格、自由灵活     |

建议：

只需要会声明式写法就可以做80%以上的项目。

只要记住有`pipeline`、`stages`、`stage`、`steps`这几个“套娃”结构就不容易出错。

# Jenkins Pipeline项目部署

技术栈：CentOS、Git、Gitee、Jenkins（Pipeline）、Docker、Docker Compose

## 源码准备

第一步：创建Gitee仓库

![image-20250714213750269](media/image-20250714213750269.png)

第二步：上传代码到本地仓库

拉取Gitee仓库

```powershell
git clone git@gitee.com:centos9/wordpress.git
```

切换到wordpress目录

```powershell
cd wordpress
```

放置代码到wordpress目录，然后提交到本地仓库并发布到Gitee仓库中

```powershell
git add .
git commit -m "提交wordpress代码"

git push origin master
```

## 安装Jenkins插件

Pipeline、Git plugin、SCM API Plugin、Credentials Plugin、Credentials Binding Plugin（流水线用环境变量传递密码时使用）、Publish Over SSH

系统安装sshpass工具

```powershell
dnf install sshpass -y
```

## 配置生产环境

安装Docker

```powershell
[root@sever ~]# yum install wget -y
[root@sever ~]# wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo
[root@sever ~]# yum install docker-ce -y

[root@sever ~]# systemctl start docker
[root@sever ~]# systemctl enable docker
[root@sever ~]# systemctl status docker
```

安装Docker Compose

```powershell
[root@sever ~]# mv docker-compose-linux-x86_64 /usr/local/bin/docker-compose
[root@sever ~]# chmod +x /usr/local/bin/docker-compose
```

Web环境部署

```powershell
[root@sever ~]# mkdir web
[root@sever ~]# cd web
[root@sever ~]# mkdir www php mysql
[root@sever ~]# touch php/php.ini
[root@sever ~]# vim docker-compose.yml
services:
  nginx:
    image: nginx:1.25
    container_name: nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./www:/var/www/html
    depends_on:
      - php

  php:
    build: ./php
    container_name: php
    restart: always
    volumes:
      - ./www:/var/www/html
      - ./php/php.ini:/usr/local/etc/php/php.ini
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: wordpress
    ports:
      - "3306:3306"
    volumes:
      - ./mysql/data:/var/lib/mysql
      
[root@sever ~]# vim php/Dockerfile
FROM php:8.3-fpm

# 安装常用WordPress依赖扩展
RUN apt-get update \
    && apt-get install -y libjpeg-dev libpng-dev libfreetype6-dev libzip-dev libonig-dev libicu-dev libxml2-dev libcurl4-openssl-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd exif zip mysqli pdo_mysql intl mbstring opcache

# 可选，安装curl扩展
RUN docker-php-ext-install curl

# 可选，推荐开启opcache配置（可提升php性能）
COPY php.ini /usr/local/etc/php/php.ini
```

运行Docker Compose

```powershell
 docker-compose up -d
```

停止Docker容器（了解，不需要执行）

```powershell
docker-compose stop
```

删除Docker容器（了解，不需要执行）

```powershell
docker-compose down
```

配置Nginx

```powershell
echo '
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        fastcgi_pass php:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
' > nginx/conf.d/default.conf
```

## 创建pipeline流水线项目

创建web项目

![image-20250714221438045](media/image-20250714221438045.png)

生成代码拉取流水线

![image-20250714222120635](media/image-20250714222120635.png)

![image-20250714222305320](media/image-20250714222305320.png)

地址信息：

```powershell
checkout scmGit(branches: [[name: '*/master']], extensions: [], userRemoteConfigs: [[credentialsId: 'bbe429d6-a97d-495a-b1d2-edbcfc53be5e', url: 'https://gitee.com/centos9/wordpress.git']])
```

设置项目信息，并勾选丢弃旧的构建

![image-20250714221633585](media/image-20250714221633585.png)

设置流水线

```powershell
pipeline {
  agent any
  environment {
    DEPLOY_SERVER = '192.168.88.200'
    DEPLOY_USER = 'root'
    DEPLOY_PASSWORD = '123456'    // 这里要改成你的真实密码
    REMOTE_WEB_ROOT = '/root/web/www/'
  }
  stages {
    stage('拉取 WordPress 代码') {
      steps {
        checkout scmGit(
          branches: [[name: '*/master']],
          extensions: [],
          userRemoteConfigs: [[
            credentialsId: 'bbe429d6-a97d-495a-b1d2-edbcfc53be5e', // 改为你的 Gitee 凭据ID
            url: 'https://gitee.com/centos9/wordpress.git'
          ]]
        )
      }
    }

    stage('清空远端 Web 目录') {
      steps {
        sh """
          sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "rm -rf ${REMOTE_WEB_ROOT}/*"
        """
      }
    }

    stage('发布代码到 Web 容器') {
      steps {
        sh """
          sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "mkdir -p ${REMOTE_WEB_ROOT}"
          sshpass -p "${DEPLOY_PASSWORD}" scp -r ./* ${DEPLOY_USER}@${DEPLOY_SERVER}:${REMOTE_WEB_ROOT}/
        """
      }
    }

    stage('重载 Nginx 服务') {
      steps {
        sh """
          # 如果用docker compose可以reload nginx，以下路径需替换为实际的compose文件路径
          sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "docker exec nginx nginx -s reload || true"
        """
      }
    }
  }
  post {
    success {
      echo "部署成功！WordPress 已同步到 LNMP 容器。"
    }
    failure {
      echo "部署失败，请检查日志！"
    }
  }
}
```

构建pipeline流水线任务

![image-20250714225005160](media/image-20250714225005160.png)

查看控制台输出

![image-20250714225059975](media/image-20250714225059975.png)

访问http://Web服务器IP地址/，完成wordpress安装，最终如下图所示

![image-20250714225431531](media/image-20250714225431531.png)

# Jenkins + Gitee Tag 自动化发布系统

版本回退

v1.0

v2.0（稳定版）

v3.0（最新版本），发现v3.0不及预期。

## 安装Jenkins 插件

Git Parameter Plug-In：用于获取Gitee版本仓库的Tag标签（文本域选择方式）=> 本次使用这个

Active Choices plugin：用于获取Gitee版本仓库的Tag标签（下拉选项方式）

## 添加v2版本代码

准备phpinfo.php文件

```powershell
<?php
  phpinfo();
?>
```

上传Gitee仓库设置Tag标签

```powershell
git add .
git commit -m "add phpinfo.php"
git push origin master

git tag -a v2.0 -m "v2.0版本"
git push origin master v2.0
```

## 重新配置Pipeline项目

创建tag参数

![image-20250714231101876](media/image-20250714231101876.png)

重新配置pipeline流水线

```powershell
pipeline {
  agent any
  environment {
    DEPLOY_SERVER = '192.168.88.200'
    DEPLOY_USER = 'root'
    DEPLOY_PASSWORD = '123456'
    REMOTE_WEB_ROOT = '/root/web/www/'
  }
  //parameters {
    //这个位置就是填写你要设置的tag参数
    //string(name: 'tag', defaultValue: '$tag', description: 'Git标签')
  //}
  stages {
    stage('拉取 WordPress 代码') {
      steps {
        // 拉取指定tag代码
        checkout([
          $class: 'GitSCM',
          branches: [[name: "refs/tags/${params.tag}"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [],
          userRemoteConfigs: [[
            credentialsId: 'bbe429d6-a97d-495a-b1d2-edbcfc53be5e',
            url: 'https://gitee.com/centos9/wordpress.git'
          ]]
        ])
      }
    }

    stage('清空远端 Web 目录') {
      steps {
        sh """
          sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "rm -rf ${REMOTE_WEB_ROOT}/*"
        """
      }
    }

    stage('发布代码到 Web 容器') {
      steps {
        sh """
          sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "mkdir -p ${REMOTE_WEB_ROOT}"
          sshpass -p "${DEPLOY_PASSWORD}" scp -r ./* ${DEPLOY_USER}@${DEPLOY_SERVER}:${REMOTE_WEB_ROOT}/
        """
      }
    }

    stage('重载 Nginx 服务') {
      steps {
        sh """
          sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "docker exec nginx nginx -s reload || true"
        """
      }
    }
  }
  post {
    success {
      echo "部署成功！WordPress 已同步到 LNMP 容器。"
    }
    failure {
      echo "部署失败，请检查日志！"
    }
  }
}

参数说明：
如果你是在可视化界面里已经加了“标签”类型参数，Jenkinsfile里可以不用重复写`parameters`那一块，但加了也没事。实际以你界面参数为准。
 
checkout拉取tag代码
branches: [[name: "refs/tags/${params.tag}"]], 这样就能拉取Git仓库中你选择的tag。
如果参数名是其他，比如`git_tag`，就改为`${params.git_tag}`。
```

## 选择Tag重新构建任务

![image-20250714233238016](media/image-20250714233238016.png)

查看运行结果

![image-20250714233309866](media/image-20250714233309866.png)

测试验证代码，输入http://Web服务器IP/phpinfo.php

![image-20250714234302498](media/image-20250714234302498.png)

# 集成SonarQube代码质量检查

静态代码分析是指无需运行被测代码，仅通过分析或检查源程序的语法、结构、过程、接口等来检查程序的正确性，找出代码隐藏的错误和缺陷，如：参数不匹配、有歧义的嵌套语句、错误的递归、非法计算、可能出现的空指针引用等等。

静态代码扫描是CI/CD中重要的一环，可以在代码提交到代码仓库之后，在CI/CD流程中加入代码扫描步骤，从而及时地对代码进行质量的检查。这可以有效地降低后期维护成本，优化产品质量，提高产品交付速度。同时，静态代码扫描还可以将代码问题自动通知给开发人员，使得问题得到及时发现和解决。

> 通俗地说，通过将静态代码分析融入到CI/CD流程中，可以进一步提高软件开发过程的效率和质量，帮助团队快速交付高质量的产品。

## 安装SonarQube工具

安装PostgreSQL数据库

mysql:3306

pgsql:5432

```powershell
docker pull postgres:latest
mkdir -p /postgres/{postgresql,data}
docker run -itd --name postgres -p 5432:5432 -v /postgres/postgresql:/var/lib/postgresql -v /postgres/data:/var/lib/postgresql/data -v /etc/localtime:/etc/localtime:ro -e POSTGRES_USER=sonar -e POSTGRES_PASSWORD=sonar -e POSTGRES_DB=sonar -e TZ=Asia/Shanghai --restart always --privileged=true -u 0 postgres:latest

docker ps
docker logs -f postgres
```

拉取SonarQube工具

```powershell
docker pull sonarqube:9.9-community
mkdir -p /sonarqube/{extensions,logs,data}
chmod -R 777 /sonarqube
docker run -itd --name sonarqube -p 9000:9000 --link postgres -v /sonarqube/conf:/opt/sonarqube/conf -v /sonarqube/extensions:/opt/sonarqube/extensions -v /sonarqube/logs:/opt/sonarqube/logs -v /sonarqube/data:/opt/sonarqube/data -e SONARQUBE_JDBC_URL=jdbc:postgresql://postgres:5432/sonar -e SONARQUBE_JDBC_USERNAME=sonar -e SONARQUBE_JDBC_PASSWORD=sonar --restart always --privileged=true sonarqube:9.9-community
```

访问SonarQube，http://Web服务器IP:9000/

![image-20250715000644211](media/image-20250715000644211.png)

默认账号密码都是admin/admin

修改SonarQube密码

![image-20250715000721828](media/image-20250715000721828.png)

配置中文界面

![image-20250715001029119](media/image-20250715001029119.png)

![image-20250715001205255](media/image-20250715001205255.png)

![image-20250715001258881](media/image-20250715001258881.png)

## 创建项目

![image-20250715001802329](media/image-20250715001802329.png)

![image-20250715001831447](media/image-20250715001831447.png)

## 获取Token令牌

![image-20250715002041202](media/image-20250715002041202.png)

获取令牌

![image-20250715002150071](media/image-20250715002150071.png)

复制令牌：sqp_8f3a93910ddc418420925bc6a26114711de871ef

安装Jenkins SonarQube插件

![image-20250715002526058](media/image-20250715002526058.png)

配置SonarQube

![image-20250715002942538](media/image-20250715002942538.png)

![image-20250715003149233](media/image-20250715003149233.png)

## 安装 sonar-scanner

注意：以下sonar-scanner命令行工具，需要在Jenkins服务器安装。

```powershell
cd /opt
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
ln -s /opt/sonar-scanner-5.0.1.3006-linux/bin/sonar-scanner /usr/local/bin/sonar-scanner
```

配置环境变量

```powershell
vim /etc/profile
export PATH=$PATH:/opt/sonar-scanner-5.0.1.3006-linux/bin

source /etc/profile
```

Jenkins全局工具配置

![image-20250715013445310](media/image-20250715013445310.png)

安装node工具（SonarQube依赖）

```powershell
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs
```

## 重新设置pipeline流水线代码

```powershell
pipeline {
    agent any
    environment {
        DEPLOY_SERVER = '192.168.88.200'
        DEPLOY_USER = 'root'
        DEPLOY_PASSWORD = '123456'
        REMOTE_WEB_ROOT = '/root/web/www/'
        SONAR_HOST_URL = 'http://192.168.88.200:9000'
        SONAR_TOKEN = 'sqp_73b6338c17d5e71859cc6b444e54809a126ca230'
    }
    stages {
        stage('拉取 WordPress 代码') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "refs/tags/${params.tag}"]],
                    extensions: [],
                    userRemoteConfigs: [[
                        credentialsId: 'bbe429d6-a97d-495a-b1d2-edbcfc53be5e',
                        url: 'https://gitee.com/centos9/wordpress.git'
                    ]]
                ])
            }
        }

        stage('SonarQube 代码扫描') {
            steps {
                script {
                    withSonarQubeEnv('sonarqube') {
                        sh "which sonar-scanner"
                        sh """
                            sonar-scanner \\
                              -Dsonar.projectKey=wordpress \\
                              -Dsonar.projectName=WordPress \\
                              -Dsonar.projectVersion=${params.tag} \\
                              -Dsonar.sources=. \\
                              -Dsonar.host.url=${SONAR_HOST_URL} \\
                              -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('清空远端 Web 目录') {
            steps {
                sh """
                  sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "rm -rf ${REMOTE_WEB_ROOT}/*"
                """
            }
        }

        stage('发布代码到 Web 容器') {
            steps {
                sh """
                  sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "mkdir -p ${REMOTE_WEB_ROOT}"
                  sshpass -p "${DEPLOY_PASSWORD}" scp -r ./* ${DEPLOY_USER}@${DEPLOY_SERVER}:${REMOTE_WEB_ROOT}
                """
            }
        }

        stage('重载 Nginx 服务') {
            steps {
                sh """
                  sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "docker exec nginx nginx -s reload || true"
                """
            }
        }
    }
    post {
        success {
            echo "部署成功！WordPress 已同步到 LNMP 容器。"
        }
        failure {
            echo "部署失败，请检查日志！"
        }
    }
}
```

构建Pipeline

![image-20250715014732990](media/image-20250715014732990.png)

时间会比较久，最终运行结果：

![image-20250715020721187](media/image-20250715020721187.png)