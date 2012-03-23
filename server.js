var Util = require('util');
var Http = require('http');
var Fs = require('fs');
var Url = require('url');
var Path = require('path');

var DEV = process.argv.indexOf('-dev') >= 0 ? true : false;

var vhost = require('./vhost').vhost;
var rrs = vhost.RewriteRule;
var wwwroot = vhost.DocumentRoot || __dirname;
var config = require('./config');
var mime = require("./mime").types;
var portParamIndex = process.argv.indexOf('-port');
var PORT = portParamIndex >= 0 ? process.argv[1 + portParamIndex] : 80;
console.log('port:'+PORT);

var server = Http.createServer(function(request, response){
	//console.log(request);
	var uri = Url.parse(request.url).pathname;
	//url rewrite
	var rule, urlRule, reurlRule, flag;
	
	if(rrs.length){
		for(var i = 0, l = rrs.length; i < l; i++){
			rule = rrs[i].split(/\s+/);
			urlRule = new RegExp(rule[0], 'i');
			reurlRule = rule[1];
			flag = rule[2];
			
			if(urlRule.test(uri)){
				if(/http:\/\//.test(reurlRule)){	//rewrite 到网络文件
					uri = request.url.replace(urlRule, reurlRule);
					var pathname = uri;
					pathname = pathname.replace(/\.\./g, '');
					returnNetFile(request, response, pathname, flag);
				}else{								//rewrite 到本地文件
					uri = uri.replace(urlRule, reurlRule);
					var pathname = wwwroot + uri;
					pathname = Path.normalize(pathname.replace(/\.\./g, ''));
					returnLocalFile(request, response, pathname);
				}
				break;
			}
		}
	}else{
		uri = uri.replace(urlRule, reurlRule);
		var pathname = wwwroot + uri;
		pathname = Path.normalize(pathname.replace(/\.\./g, ''));
		returnLocalFile(request, response, pathname);
	}
});
server.listen(PORT);

function returnNetFile(request, response, pathname, flag){
	//var res = /http:\/\/(.*?)(\/.*)/.exec(pathname);
	if(flag == 301 || flag == 302){
		response.writeHead(flag, {
			'Location':pathname
		});
		console.log(flag, pathname);
		response.end();
	}else{
		response.writeHead(404,{
			'Content-Type':'text/plain'
		});
		response.write("404");
		response.end();
	}
}

function returnLocalFile(request, response, pathname){
	Path.exists(pathname, function(exists){
		if(!exists){
			response.writeHead(404,{
				'Content-Type':'text/plain'
			});
			console.log(404, pathname);
			response.write("404");
			response.end();
		}else{
			Fs.readFile(pathname, "binary", function(err, file){
				if(err){
					response.writeHead(500, {
						'Content-Type':'text/plain'
					});
					console.log(500, pathname);
					response.write(err);
				}else{
					var ext = Path.extname(pathname);
					ext = ext ? ext.slice(1) : 'unknown';
					//根据文件后缀返回不同的content-type
					response.setHeader('Content-Type', mime[ext] || 'text/plain');
					
					Fs.stat(pathname, function(err, stat){
						var lastModified = stat.mtime.toUTCString();
						var ifModifiedSince = "If-Modified-Since".toLowerCase();
						response.setHeader("Last-Modified", lastModified);
						//设置缓存过期时间
						if (ext.match(config.Expires.fileMatch)) {
							var expires = new Date();
							expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
							response.setHeader("Expires", expires.toUTCString());
							response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
						}
						//根据lastModify返回不同的状态
						if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {
							response.writeHead(304, "Not Modified");
							response.end();
						} else {
							Fs.readFile(pathname, "binary", function(err, file) {
								if (err) {
									response.writeHead(500, "Internal Server Error", {'Content-Type': 'text/plain'});
									console.log(500, pathname);
									response.end(err);
								} else {
									response.writeHead(200, "Ok");
									//console.log(200, pathname);
									response.write(file, "binary");
									/* if(/merge/.test(pathname)){
										//console.log(file)
										var reg = /[^'"]*?(?=ImportJavscript\.url\(['"]?)(?!=['"]?)\)/g;
										var pathArr = file.match(reg);
										console.log(pathArr,'***********');
									} */
									response.end();
								}
							});
						}
					});
				}
			});
		}
	});
}

Util.puts((DEV ? 'DEV MODE ' : '') + wwwroot+' Server running...');