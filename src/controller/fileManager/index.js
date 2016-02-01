const nodefn = require('when/node');
const fs = require('fs');
//const invariant = require('invariant');
const when = require('when');
const _ = require('underscore');
const path = require('path');
const pathExists = require('path-exists');
const svnUltimate = require('node-svn-ultimate');
var log4js = require('log4js');
var log4js_extend = require("log4js-extend");
log4js_extend(log4js, {
	path: __dirname,
	format: "at @name (@file:@line:@column)"
});
var logger = log4js.getLogger();
const svnOptions = {
	username: 'corco',
	password: 'corco',
	cwd: process.env.CORCO_SVN_PATH
};

const svn = {
	add: function( filePath, options ) {
		var deferred = when.defer();
		options = _.extend({}, svnOptions, options );
		svnUltimate.commands.add( filePath, options, ( err ) => {
			if( err ) {
				logger.error( err );
				deferred.reject( err );
			}
			deferred.resolve();
		});
		return deferred.promise;
	},
	update: function( options ) {
		var deferred = when.defer();
		options = _.extend({}, svnOptions, options );
		svnUltimate.commands.update( options, ( err ) => {
			if( err ) {
				logger.error( err );
				deferred.reject( err );
			}
			deferred.resolve();
		});
		return deferred.promise;
	},
	commit: function( filePath, options ) {
		var deferred = when.defer();
		options = _.extend({},svnOptions,{ params: ['-m "Save from web"'] }, options );
		svnUltimate.commands.commit( filePath, options, ( err ) => {
			if( err ) {
				logger.error( err );
				deferred.reject( err );
			}
			deferred.resolve();
		});
		return deferred.promise;
	}
};

let rootPath = '';

function realPath( relativePath ) {
	return path.join( rootPath, relativePath );
}

const fileManager = {

	createFile: ( fileName, raw ) => {

		logger.debug('createFile');
		var filePath = realPath( fileName );

		return svn.update().then( () => {

			var alreadyExist = pathExists.sync( filePath );
			if( alreadyExist ) {
				logger.error( { errorCode: 'ALREADY_EXIST' } );
				throw { errorCode: 'ALREADY_EXIST' };
			}

			return nodefn.call( fs.writeFile, filePath, raw );

		}).then( function() {

			return svn.add( filePath );

		}).then( function() {
			return svn.commit( filePath );
		});
	},

	updateFile: ( fileName, raw ) => {

		var filePath = realPath( fileName );

		return svn.update().then( () => {

			var alreadyExist = pathExists.sync( filePath );
			if( ! alreadyExist ) {
				logger.error( { errorCode: 'NO_EXIST_FILE' } );
				throw { errorCode: 'NO_EXIST_FILE' };
			}

			return nodefn.call( fs.writeFile, filePath, raw );

		}).then( function() {
			return svn.commit( filePath );
		});
	},

	loadFile: ( fileName ) => {
		return nodefn.call( fs.readFile, realPath( fileName ), { encoding: 'utf8' });
	},

	loadFileList: () => {

		logger.debug( rootPath );
		return nodefn.call( fs.readdir, rootPath ).then( ( fileList ) => {

			return _.filter( fileList, ( fileName ) => {
				if( /\.corco$/.test( fileName )) return true;
			});
		});
	},

	initRootPath: ( root ) => {
		console.log('initRootPath');
		rootPath = root;
	}
};

module.exports = fileManager;
