/**
 * Router for CorcoFile RESTFul Model
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
var log4js = require('log4js');
var log4js_extend = require("log4js-extend");
log4js_extend(log4js, {
	path: __dirname,
	format: "at @name (@file:@line:@column)"
});
var logger = log4js.getLogger();

var DOC_DIR_PATH = process.env.DOC_DIR_PATH;
var fileManager = require('./fileManager/index');
fileManager.initRootPath( DOC_DIR_PATH );

logger.debug('29');

/**
 * @api {post} /readDocList readDocList
 * @apiGroup Doc
 * @apiName readDocList
 * @apiDescription READ the all doc list
 * @apiVersion 0.1.0
 * @apiUse CommonResult
 *
 * @apiUse CommonErrorCode
 * @apiError (errorCode) { string } NO_ROOT_DIRECTORY the root directory in the server side was not found
 *
 * @apiSuccess { array } doc fileName list
 * @apiSuccessExample Example data on success:
 * {
 * 	fileList: ["test1.corco","test2.corco"]
 * }
 *
 * @apiSampleRequest /readDocList
 */
router.post('/readDocList', (req, res, next) => {

	fileManager.loadFileList().then( ( fileList ) => {
		res.send( fileList );
	});
});

/**
 * @api {post} /readDoc readDoc
 * @apiGroup Doc
 * @apiName readDoc
 * @apiDescription READ the contents of specific filename
 * @apiVersion 0.1.0
 *
 * @apiParam { string } fileName fileName
 *
 * @apiSuccessExample Example data on success:
 * {
 * 	raw: "corco_question\n질문합니다!\ncorco_answer\n답변합니다"
 * }
 *
 * @apiSampleRequest /readDoc
 * @apiSampleRequestParam fileName="test.corco"
 */
router.post('/readDoc', (req, res, next) => {

	const fileName = req.body.fileName;
	
	logger.debug( fileName );
	logger.debug('post /readDoc/'+fileName);
	//var filePath = path.join( CORCO_SVN_PATH, req.params.fileName );
	fileManager.loadFile( fileName ).then( ( fileContent ) => {
		res.send({ raw: fileContent });
	});
});


/**
 * @api {post} /createDoc createDoc
 * @apiGroup Doc
 * @apiName createDoc
 * @apiDescription CREATE a new corco file
 * @apiVersion 0.1.0
 *
 * @apiParam { string } fileName The contents of corcoFile want to be save
 * @apiParam { string } raw The contents of corcoFile want to be save
 *
 * @apiSuccess { string } errorCode A result of the request
 * @apiSuccessExample Example data on success:
 * { errorCode: "NO_ERROR" }
 *
 * @apiSampleRequest /createDoc
 * @apiSampleRequestParam fileName="test4.corco"
 * @apiSampleRequestParam raw="test test test"
 */
router.post('/createDoc', (req, res, next) => {

	console.log('wef');
	logger.info( req.body );
	fileManager.createFile( req.body.fileName, req.body.raw ).then( () => {
		res.send({ errorCode: 'NO_ERROR' });
	}).catch( ( err ) => {
		res.send( err );
	});
});

/**
 * @api {post} /updateDoc updateDoc
 * @apiGroup Doc
 * @apiName updateDoc
 * @apiDescription UPDATE a exist corco file
 * @apiVersion 0.1.0
 *
 * @apiParam { string } fileName fileName
 * @apiParam { string } raw The contents of corcoFile want to be save
 *
 * @apiSuccess { string } errorCode A result of the request
 * @apiSuccessExample Example data on success:
 * { errorCode: "NO_ERROR" }
 *
 * @apiSampleRequest /updateDoc
 * @apiSampleRequestParam fileName="test4.corco"
 * @apiSampleRequestParam raw="test test test"
 */
router.post('/updateDoc', (req, res, next) => {

	fileManager.updateFile( req.body.fileName, req.body.raw ).then( () => {
		res.send({ errorCode: 'NO_ERROR' });
	}).catch( ( err ) => {
		res.send( err );
	});
});

module.exports = router;
