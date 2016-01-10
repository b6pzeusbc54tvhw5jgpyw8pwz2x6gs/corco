/**
 * Router for etc
 */
/**
 * @apiDefine CommonResult
 * @apiSuccess { string } errorCode A result of the request
 */
/**
 * @apiDefine CommonErrorCode
 * @apiError (errorCode) { string } NO_ERROR success
 */

var express = require('express');
var router = express.Router();
var path = require('path');
var sass = require('node-sass');

var logger = require('tracer').colorConsole();

logger.debug( 'DEVELOPMENT', typeof process.env.DEVELOPMENT );
logger.debug( 'DEVELOPMENT', process.env.DEVELOPMENT );
logger.debug( 'PUBLIC_PATH', process.env.PUBLIC_PATH );
logger.debug( '__dirname', __dirname );
logger.debug( 'cwd()', process.cwd() );
logger.debug( 'a StartScript:' + process.env.START_SCRIPT_PATH );

router.get('/', (req, res, next) => {
	logger.debug('hi');
	res.sendFile( path.join( process.env.PUBLIC_PATH, 'index.html' ));
});

router.get('/css/style.css', (req, res, next) => {

	logger.debug('get /css/style.css');

	var sassPath = path.join( process.env.PUBLIC_PATH, 'css/style.scss' );

	sass.render({ file: sassPath }, (err, result) => {
		if (err) {
			logger.error( err );
			res.send( err );
		}
		res.set('Content-Type', 'text/css');
		res.send( result.css );
	});
});

module.exports = router;
