var connect = require("connect");

var portParamIndex = process.argv.indexOf('-port');
var PORT = portParamIndex >= 0 ? process.argv[1 + portParamIndex] : 80;

connect().use(connect.static("/home/wan/workspace/PSD2HTML")).listen(PORT);
