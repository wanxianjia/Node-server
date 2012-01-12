exports.vhost = {
	DocumentRoot: 'E:\\workspace',
	RewriteRule: [
		'^\\/css\\/app\\/search(.*)			/style_asc/css/app/search$1',
		'^\\/js\\/app\\/search(.*)			/style_asc/js/app/search$1',
		//train
		'^\\/app\\/bp\\/css\\/train(.*)		/net_course/style_bp/css/train$1',
		'^\\/app\\/bp\\/js\\/train(.*)		/net_course/style_bp/js/train$1',
		//301
		'^(.*)$								http://10.20.136.169$1 [301]'
	]
}