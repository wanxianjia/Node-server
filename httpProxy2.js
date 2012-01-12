var util = require('util'),
    //colors = require('colors'),
    http = require('http'),
    httpProxy = require('./lib/node-http-proxy');

var welcome = [
  '# # ##### ##### ##### ##### ##### #### # # # #',
  '# # # # # # # # # # # # # # # # ',
  '###### # # # # ##### # # # # # # ## # ',
  '# # # # ##### ##### ##### # # ## # ',
  '# # # # # # # # # # # # # ',
  '# # # # # # # # #### # # # '
].join('\n');

//util.puts(welcome.rainbow.bold);

//
// Basic Http Proxy Server
//
httpProxy.createServer(8080, 'localhost').listen(80);

//
// Target Http Server
//
http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write('request successfully proxied to: ' + req.url + '\n' + JSON.stringify(req.headers, true, 2));
	res.end();
}).listen(8080);

//util.puts('http proxy server'.blue + ' started '.green.bold + 'on port '.blue + '8000'.yellow);
//util.puts('http server '.blue + 'started '.green.bold + 'on port '.blue + '9000 '.yellow);