var util = require('util');
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var net = require('net');

var vhost = require('./vhost').vhost;
var rrs = vhost.RewriteRule;
var wwwroot = vhost.DocumentRoot || __dirname;
var config = require('./config');
var mime = require("./mime").types;
var PORT = 80;

var server = http.createServer(function(request, response){
	//console.log(request);
	var uri = url.parse(request.url).pathname;
	var rewriteFlag = 'LOCAL';
	//url rewrite
	var rule, urlRule, reurlRule, flag;
	
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
				returnNetFile(request, response, pathname);
			}else{								//rewrite 到本地文件
				console.log(uri)
				uri = uri.replace(urlRule, reurlRule);
				console.log(uri)
				var pathname = wwwroot + uri;
				console.log(pathname)
				pathname = path.normalize(pathname.replace(/\.\./g, ''));
				console.log(pathname)
				returnLocalFile(request, response, pathname);
			}
			break;
		}
	}
});
server.listen(PORT);

function returnNetFile(request, response, pathname){
	//var res = /http:\/\/(.*?)(\/.*)/.exec(pathname);
	response.writeHead(301, {
		'Location':pathname
	});
	console.log(301, pathname);
	response.end();
}

function returnLocalFile(request, response, pathname){
	path.exists(pathname, function(exists){
		if(!exists){
			response.writeHead(404,{
				'Content-Type':'text/plain'
			});
			console.log(404, pathname);
			response.write("404");
			response.end();
		}else{
			fs.readFile(pathname, "binary", function(err, file){
				if(err){
					response.writeHead(500, {
						'Content-Type':'text/plain'
					});
					console.log(500, pathname);
					response.write(err);
				}else{
					var ext = path.extname(pathname);
					ext = ext ? ext.slice(1) : 'unknown';
					//根据文件后缀返回不同的content-type
					response.setHeader('Content-Type', mime[ext] || 'text/plain');
					
					fs.stat(pathname, function(err, stat){
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
							fs.readFile(pathname, "binary", function(err, file) {
								if (err) {
									response.writeHead(500, "Internal Server Error", {'Content-Type': 'text/plain'});
									console.log(500, pathname);
									response.end(err);
								} else {
									response.writeHead(200, "Ok");
									console.log(200, pathname);
									response.write(file, "binary");
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

util.puts(wwwroot+' Server running...');