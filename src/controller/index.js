var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var sass = require('node-sass');

var logger = require('tracer').colorConsole();

var CORCO_SVN_PATH = process.env.CORCO_SVN_PATH;
var fileManager = require('./fileManager')( CORCO_SVN_PATH );
fileManager = fileManager.initRootPath( CORCO_SVN_PATH );


/* GET home page. */
//router.get('/', (req, res, next) => {
	//res.render('index', { title: 'Express' });
//});

router.get('/css/style.css', (req, res, next) => {

	logger.debug('get /css/style.css');
	logger.debug('get hihihi');

	var sassPath = path.join( process.cwd(), 'public/css/style.scss' );

	sass.render({ file: sassPath }, (err, result) => {
		logger.debug( err );
		logger.debug( result.css );
		res.set('Content-Type', 'text/css');
		res.send( result.css );
	});
});

router.get('/corcoFile/:fileName', (req, res, next) => {
	
	logger.debug('get /corcoFile/'+req.params.fileName);
	var filePath = path.join( CORCO_SVN_PATH, req.params.fileName );
	fileManager.getFile( filePath ).then( ( file ) => {

		res.send( file );
	});

	//var filePath = path.join( process.cwd(), 'corcoFile', 'test.corco' );
	//fs.readFile( filePath, 'utf8', ( err, content ) => {
		//if( err ) {
			//res.send( err );
			//return;
		//}
		//res.send({ raw: content });
	//});
});

router.get('/corcoFile', (req, res, next) => {

	logger.debug('get /corcoFile');

	fileManager.getFileList( CORCO_SVN_PATH ).then( ( fileList ) => {

		res.send({ fileList: fileList });
	});

});

module.exports = router;
