const nodefn = require('when/node');
const fs = require('fs');
//const invariant = require('invariant');
const when = require('when');
const _ = require('underscore');
const path = require('path');
const pathExists = require('path-exists');
const svnUltimate = require('node-svn-ultimate');
const logger = require('tracer').colorConsole();
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

	saveFile: ( fileName, raw ) => {

		logger.debug('saveFile');
		var filePath = realPath( fileName );
		var alreadyExist = pathExists.sync( filePath );

		logger.debug('saveFile1');


		return nodefn.call( fs.writeFile, filePath, raw ).then( () => {
			
			return svn.update();

		}).then( function() {

			if( ! alreadyExist ) {
				return svn.add( filePath );
			}

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
