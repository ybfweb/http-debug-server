#!/usr/bin/env node
const fs   = require('fs');
const http = require('http');
const os   = require('os');
var colors = require('colors');

//显示帮助
if(process.argv.indexOf('-h') > -1 || process.argv.indexOf('-help') > -1){
	console.log(colors.bgCyan([
		'http-debug-server ',
		'   -p  监听端口号',
		'   -config path   配置文件path为相对路径'
	].join('\n')));
  process.exit();
}

// read config
const config = {
	port: 8080,
	proxy: null
};
// 获取 cli 参数
let cliConfig = getCliConfig();
config.port = cliConfig.port || config.port;
let configPath = cliConfig.configFile ? process.cwd() + '/' + cliConfig.configFile : process.cwd() + '/hds.config.json';
// 检查配置文件
fs.stat(configPath,function(err, stats){
	if(!err){
		fs.readFile(configPath, (err, data) => {
			if (err) throw err;
			let dataJson = JSON.parse(data.toString());
			dataJson = Object.assign(config,dataJson);
			startServer(dataJson)
		});
	}else {
		startServer(config);
	}
});

// 启动服务器
function startServer(config){
	const req = http.createServer(function (request, response) {
		// response.setEncoding('utf8');
		let path = request.url;
		if(config.proxy && typeof config.proxy == 'object'){
			let activeProxy = null;
			for(let item in config.proxy){
				if(path.startsWith(item)){
					activeProxy = item;
				}
			}
			let body = [];
			request.on('data',(chunk)=>{
				body.push(chunk);
			});
			request.on('end',()=>{
				// 如果有代理
				if(activeProxy && request.url.indexOf(activeProxy) > -1){
					let url = request.url.replace(activeProxy,'');
					url = config.proxy[activeProxy] + url;
					body = Buffer.concat(body).toString();
					getRequest(request,response,body,url);
				}else {
					getPathContent(path, response);
				}
			});
		}else {
			getPathContent(path, response);
		}
	});
	req.listen(config.port,function(){
		let ifaces = os.networkInterfaces();
		console.log(colors.yellow('linsten:'))
		Object.keys(ifaces).forEach(function (dev) {
			ifaces[dev].forEach(function (details) {
				if (details.family === 'IPv4') {
					console.info(colors.green('  http://' + details.address + ':' + config.port.toString()));
				}
			});
		});
		console.info(colors.red('Hit CTRL-C to stop the server'));
	});
}

// 读取服务器静态资源
function getPathContent(path, res) {
	let root = process.cwd();
	let fullPath = root + path;
	fs.stat(fullPath, function (err, stats) {
		if(err){
			res.setHeader('Content-Type', 'application/json');
			res.statusCode = 400;
			res.end('路径有误，找不到文件或者文件夹'.toString('urf8'));
			return;
		}
		if (stats.isFile()) {
			res.statusCode = 200;
			fs.createReadStream(fullPath).pipe(res);
		} else if (stats.isDirectory()) {
			fs.readdir(fullPath, function (err, files) {
				res.statusCode = 200;
				let filesArr = files.map((file)=>{
					path = path == '/' ? '' : path;
					return `<a href="${path}/${file}">${file}</a>`
				});
				res.end(filesArr.join('<br>'));
			});
		}
	});
}

// 请求转发
function getRequest(request,response,data,url){
	delete request.headers.host;
	const option = {
		headers: {
			Cookie: request.headers.cookie,
			'Content-Type': request.headers.accept
		},
		method: request.method,
	};
	const req = http.request(url,option,(res) => {
		response.writeHead(res.statusCode,res.headers);
		res.pipe(response);
	});
	req.on('error',(error) => {
		console.log(error)
	});
	req.write(data);
	req.end();
}

function getCliConfig(){
	let obj = {};
	let params = process.argv;
	let configFile = null;
	let port = null;
	if(params.indexOf('-config') > -1){
		configFile = params.indexOf('-config') + 1;
		obj.configFile = params[configFile];
	}
	if(params.indexOf('-p') > -1){
		port = params.indexOf('-p') + 1;
		obj.port = params[port];
	}
	return obj;
};

process.on('SIGINT', function () {
  console.info(colors.red('http-server stopped.'));
  process.exit();
});

process.on('SIGTERM', function () {
  console.info(colors.red('http-server stopped.'));
  process.exit();
});