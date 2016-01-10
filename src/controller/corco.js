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
var logger = require('tracer').colorConsole();
var CORCO_SVN_PATH = process.env.CORCO_SVN_PATH;
var fileManager = require('./fileManager/index');
fileManager.initRootPath( CORCO_SVN_PATH );

/**
 * @api {get} /corcoFile GET /corcoFile
 * @apiGroup CorcoFile
 * @apiName GET /corcoFile
 * @apiDescription READ the all corcoFile list
 * @apiVersion 0.1.0
 * @apiUse CommonResult
 *
 * @apiUse CommonErrorCode
 * @apiError (errorCode) { string } NO_ROOT_DIRECTORY the root directory in the server side was not found
 *
 * @apiSuccess { array } fileList The list of corcoFiles
 * @apiSuccessExample Example data on success:
 * {
 * 	fileList: ["test1.corco","test2.corco"]
 * }
 *
 * @apiSampleRequest /corcoFile
 */
router.get('/', (req, res, next) => {

	logger.debug('get /corcoFile');
	fileManager.loadFileList( CORCO_SVN_PATH ).then( ( fileList ) => {
		res.send({ fileList: fileList });
	});
});


/**
 * @api {get} /corcoFile/:fileName GET /corcoFile/:fileName
 * @apiGroup CorcoFile
 * @apiName GET /corcoFile/:fileName
 * @apiDescription READ the contents of specific filename
 * @apiVersion 0.1.0
 *
 * @apiSuccess { string } raw The contents of corcoFile
 * @apiSuccessExample Example data on success:
 * {
 * 	raw: "corco_question\n질문합니다!\ncorco_answer\n답변합니다"
 * }
 *
 * @apiSampleRequest /corcoFile/test.corco
 */
router.get('/:fileName', (req, res, next) => {
	
	logger.debug('get /corcoFile/'+req.params.fileName);
	//var filePath = path.join( CORCO_SVN_PATH, req.params.fileName );
	fileManager.loadFile( req.params.fileName ).then( ( fileContent ) => {

		res.send({ raw: fileContent });
	});
});


/**
 * @api {post} /corcoFile/:fileName POST /corcoFile/:fileName
 * @apiGroup CorcoFile
 * @apiName POST /corcoFile
 * @apiDescription CREATE a new corco file
 * @apiVersion 0.1.0
 *
 * @apiParam { string } raw The contents of corcoFile want to be save
 *
 * @apiSuccess { string } errorCode A result of the request
 * @apiSuccessExample Example data on success:
 * { errorCode: "NO_ERROR" }
 *
 * @apiSampleRequest /corcoFile/test.corco
 */
router.post('/:fileName', (req, res, next) => {

	console.log('wef');
	fileManager.saveFile( req.params.fileName, req.body.raw ).then( () => {
		res.send({ errorCode: 'NO_ERROR' });
	});
});

/**
 * @api {put} /corcoFile/:fileName PUT /corcoFile/:fileName
 * @apiGroup CorcoFile
 * @apiName PUT /corcoFile
 * @apiDescription UPDATE a exist corco file
 * @apiVersion 0.1.0
 *
 * @apiParam { string } raw The contents of corcoFile want to be save
 *
 * @apiSuccess { string } errorCode A result of the request
 * @apiSuccessExample Example data on success:
 * { errorCode: "NO_ERROR" }
 *
 * @apiSampleRequest /corcoFile/test.corco
 */
router.put('/:fileName', (req, res, next) => {

	fileManager.saveFile( req.params.fileName, req.body.raw ).then( () => {
		res.send({ errorCode: 'NO_ERROR' });
	});
});

module.exports = router;
