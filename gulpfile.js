"use strict";

const gulp = require('gulp');
const zip = require('gulp-zip');
const babel = require('gulp-babel');
const pathExists = require('path-exists');
const invariant = require('invariant');
const path = require('path');
const del = require('del');
const _ = require('underscore');
const merge2 = require('merge2');
const fs = require('fs');
const url = require('url');
const mkdirp = require('mkdirp');
const when = require('when');
const gulpsync = require('gulp-sync')(gulp);
const pjson = require('./package.json');
const syncExec = require('sync-exec');
const ynPrompt = require('yn-prompt');
const argv = require('yargs').argv;

const logger = require('tracer').colorConsole({
	format: "{{file}}:{{line}}) {{message}}"
});


const _RELEASE_DIR_ = path.join( __dirname, 'release' );


invariant( __dirname === process.cwd(), '"gulp" must be runned in ' + __dirname);

gulp.task('_build', () => {

	let mergeList = [

		gulp.src('src/controller/**/*.js')
		.pipe(babel({ presets: ['es2015'] }))
		.pipe( gulp.dest('build/controller') ),

		gulp.src('src/app.js')
		.pipe(babel({ presets: ['es2015'] }))
		.pipe( gulp.dest('build') ),

		gulp.src('src/bin/*')
		.pipe( gulp.dest('build/bin') ),

		//gulp.src('src/views/*')
		//.pipe( gulp.dest('build/views') ),

		//gulp.src('src/public/*')
		//.pipe( gulp.dest('build/public') )
	];

	_.each( pjson.dependencies, function( version, moduleName ) {
		//logger.debug( moduleName );
		mergeList.push( 
			gulp.src( path.join('node_modules', moduleName, '**', '*' ))
			.pipe( gulp.dest( path.join('build/node_modules',moduleName )))
		);
	});

	return merge2( mergeList );
});

gulp.task('clean', () => {
	return del.sync(['build']);
});

gulp.task('_release', ( done ) => {

	// _RELEASE_DIR_: /release/
	// curVersionDir: /release/0.2.2/

	var curVersionDir = path.join( _RELEASE_DIR_, pjson.version );
	var exists = pathExists.sync( curVersionDir );

	logger.info('start to release version: ' + pjson.version );
	invariant( ! exists, 'Already '+curVersionDir+' exists');

	mkdirp.sync( curVersionDir );
	console.log( 'mkdir -p' + curVersionDir );

	var stream1 = gulp.src('package.json')
	.pipe( gulp.dest( curVersionDir ));

	var stream2 = gulp.src('build/**/*')
	.pipe( gulp.dest( curVersionDir ));

	var streamList = [ stream1, stream2 ];
	var promiseList = _.map( streamList, ( stream ) => {

		var streamDeferred = when.defer();
		stream.on('end', () => {
			streamDeferred.resolve(); 
		});
		return streamDeferred.promise;
	});

	when.all( promiseList ).then( () => {

		syncExec('npm shrinkwrap', { cwd: curVersionDir });
		
		gulp.src( path.join( curVersionDir,'**','*') )
		.pipe( zip( pjson.version + '.zip' ))
		.pipe( gulp.dest( _RELEASE_DIR_ ))
		.on('end', () => {
			logger.debug('call done()');
			done();
		});
	});
});


var goContinue = false;
gulp.task('_question', ( done ) => {

	logger.debug('_preversion');

	var result = syncExec('svn st');
	logger.warn( result.stdout );

	ynPrompt('Check the uncommited files. continue? (y/n)').then(( choice ) => {

		if( choice.toUpperCase() === 'Y' ) {
			goContinue = true;
		}
		done();
	});
});
gulp.task('preversion',['_question'], ( done ) => {
	if( ! goContinue ) {
		logger.info('canceled version up process');
		throw { errorDesc: 'canceled version up process' };
	}

	done();
});

function getSvnInfo( string ) {

	var infoResult = string.split('\n');
	var svnInfo = {};
	_.each( infoResult, ( line ) => {
		var colonIdx = line.indexOf(':');
		var key = line.substr(0, colonIdx ).trim();
		key = key.replace(/ /g,'_');
		var val = line.substr( colonIdx + 1 ).trim();
		svnInfo[ key ] = val;
	});

	return svnInfo;
}

gulp.task('version', () => {

	logger.info('npm shrinkwrap');
	syncExec('npm shrinkwrap');

	var ciCmd = 'svn commit package.json npm-shrinkwrap.json ';
	ciCmd += '-m "[script] version up server to '+pjson.version+'"';
	logger.info( ciCmd );
	syncExec( ciCmd );

	var infoResult = syncExec('svn info');
	var svnInfo = getSvnInfo( infoResult.stdout );

	//logger.debug( svnInfo );
	logger.debug('svn url:', svnInfo.URL );

	var tagsDir = svnInfo.Relative_URL.replace(/^\^\/trunk\//,'^/tags/');
	tagsDir += '/'+pjson.version;
	var svnCpCmd = 'svn copy '+svnInfo.Relative_URL+' '+tagsDir+' ';
	svnCpCmd += '-m "[script] version up server to '+ pjson.version +' ';
	svnCpCmd += 'and copy to tags/server dir."';

	logger.info( svnCpCmd );
	syncExec( svnCpCmd );
});

gulp.task('postversion', ( done ) => {

	var stgPath = path.join( __dirname, 'release', pjson.version );
	ynPrompt('Do you want to checkout this version into '+stgPath+'(y/n)')
	.then( ( yn ) => {

		if( yn.toUpperCase() !== 'Y' ) return done();

		var infoResult = syncExec('svn info');
		var svnInfo = getSvnInfo( infoResult.stdout );

		var svnHost = url.parse( svnInfo.Repository_Root ).host;
		var svnPath = url.parse( svnInfo.Repository_Root ).path;
		var tagPath = path.join( svnPath, 'tags/server', pjson.version );
		var svnPath = url.resolve( 'http://'+svnHost, tagPath ).replace(/^http/,'svn');

		var cmd = 'svn checkout '+svnPath+' '+stgPath;
		logger.info( cmd );
		syncExec( cmd );

		return ynPrompt('Do you want to copy current node_module folder into '+stgPath+'?(y/n)');

	}).then( ( yn ) => {

		if( yn.toUpperCase() !== 'Y' ) return done();

		var streamList = [];
		var dependencyList = _.extend({}, pjson.dependencies, pjson.devDependencies );
		_.each( dependencyList, function( version, moduleName ) {
			//logger.debug( moduleName );
			streamList.push(
				gulp.src( path.join('node_modules', moduleName, '**', '*' ))
				.pipe( gulp.dest( path.join( stgPath, 'node_modules', moduleName )))
			);
		});

		var promiseList = _.map( streamList, ( stream ) => {

			var streamDeferred = when.defer();
			stream.on('end', () => {
				streamDeferred.resolve(); 
			});
			return streamDeferred.promise;
		});

		return when.all( promiseList );
		
	}).then( () => {

		return ynPrompt('Do you want to build in '+stgPath+'(y/n)');

	}).then( ( yn ) => {

		if( yn.toUpperCase() !== 'Y' ) return done();

		syncExec('gulp build', { cwd: stgPath });
		return ynPrompt('Do you want to run in '+stgPath+'(y/n)');

	}).then( ( yn ) => {

		if( yn.toUpperCase() !== 'Y' ) return done();

		var processJson = require( path.join( stgPath, 'processes.stg.json' ));
		syncExec('pm2 delete '+processJson.name );
		syncExec('pm2 start processes.stg.json', { cwd: stgPath });

		return ynPrompt('Which client version do you want?(if can\'t find the version, will fetch latest version',/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);

	}).then( ( version ) => {

		fetchPublicFromClient( version, path.join( stgPath,'build/public/')).then( done );
	});
});



function fetchPublicFromClient( version, destPath, clientPath ) {

	var deferred = when.defer();

	if( ! clientPath ) {

		var dirList = fs.readdirSync( path.join( __dirname, '..', 'client', 'release' ));
		logger.debug( dirList );
		dirList.sort(function(item1, item2){
			var split1 = item1.split('.');
			var split2 = item2.split('.');
			var length = Math.min(split1.length, split2.length);

			for (var i=0; i<length; i++){
				if (+split1[i] < +split2[i])
					return -1;
				if (+split1[i] > +split2[i])
					return 1;
			}
			return split1.length - split2.length;
		});
		logger.debug( dirList );

		if( dirList.indexOf( version ) < 0 ) {
			version = dirList[ dirList.length-1 ];
		}

		clientPath = path.join( __dirname, '..', 'client/release', version );
	}

	gulp.src( path.join( clientPath, 'dist/**/*' ))
	.pipe( gulp.dest( path.join( destPath, 'client_'+version )))
	.on('end', () => {
		deferred.resolve();
	});

	return deferred.promise;
}

gulp.task('fetchPublicFromClient', () => {
	var clientDistPath = argv.clientDistPath;
	var version = argv.version;
	if( ! /^\//.test( clientDistPath )) {
		clientDistPath = path.join( __dirname, clientDistPath );
	}
	logger.debug( 'clientDistPath: ', clientDistPath );

	//fetchPublicFromClient();
});

gulp.task('build', gulpsync.sync(['clean','_build']));
gulp.task('release', gulpsync.sync(['clean','_build','_release']));
