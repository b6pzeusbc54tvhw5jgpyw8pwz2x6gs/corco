'use strict';

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var sass = require('node-sass');

/* GET home page. */
//router.get('/', function(req, res, next) {
//res.render('index', { title: 'Express' });
//});

router.get('/css/style.css', function (req, res, next) {

	console.log('get /css/style.css');
	console.log('get hihihi');

	var sassPath = path.join(process.cwd(), 'public/css/style.scss');

	sass.render({ file: sassPath }, function (err, result) {
		console.log(err);

		console.log(result.css);
		res.set('Content-Type', 'text/css');
		res.send(result.css);
	});
});

router.get('/corcoFile', function (req, res, next) {

	console.log('get /corcoFile');
	var filePath = path.join(process.cwd(), 'corcoFile', 'test.corco');
	fs.readFile(filePath, 'utf8', function (err, content) {
		if (err) {
			res.send(err);
			return;
		}
		res.send({ raw: content });
	});
});

module.exports = router;
