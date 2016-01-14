
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
