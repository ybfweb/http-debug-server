# http-debug-server hds
> 本地测试调试静态文件服务器，http支持接口转发

> 安装 install
```
npm install http-debug-server -g
```

> 启动服务器
```
cd 你的项目目录下
http-debug-server
# or
hds
```

> 配置
默认配置：
```
port: 8080 //监听8080端口
默认配置文件路径为当前目录下： hds.config.json
```
> hds.config.json
```
{
	"port": 80, 端口
	"proxy": {
		"/wapi/": "http://api.baidu.com/wapi/" //代理转发
	}
}
```

> 命令行参数
```
-config hds.config.json  //相对当前目录的路径
-p 8981 //端口号
-v or -version //版本号
```