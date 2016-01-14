const _ = require('underscore');
const path = require('path');
const pm2 = require('pm2');
const ERROR_EXIT = 1;
var argv = require('yargs').argv;
//const SUCCESS_EXIT = 0;

const CDN_HOME_DIR = __dirname;
const DEVELOPMENT = true;

const processName = "parallels-comment";

var pm2script = {
	"name": processName,
	"cwd": DEVELOPMENT ? path.join( __dirname,'src') : '',
	"args": ["--color"],
	"script": path.join('bin','www'),

	//"instances": 1, //or 0 => 'max'
	"min_uptime": "10s", // defaults to 15
	"max_restarts": 3, // defaults to 15

	"watch": DEVELOPMENT ? [path.join('..','starter.js'), "**/*"] :  ["./"],
	"ignore_watch": ["[\\/\\\\]\\./", "node_modules"],
	"merge_logs": true,

	// Default environment variables that will be injected in any environment and at any start
	"env": {
		"PORT": 3015,
		"DEVELOPMENT": true,
		"PRODUCTION": false,

		"DOC_DIR_PATH": path.join( CDN_HOME_DIR, "files" ),

		"VIEWS_PATH": path.join( CDN_HOME_DIR, "views" ),
		"PUBLIC_PATH": path.join( CDN_HOME_DIR, 'public' )
	},
	"env_*" : {
		"SPECIFIC_ENV" : true
	}
};

pm2.connect( function( err ) {

	if (err) {

		console.error( err );
		process.exit( ERROR_EXIT );
	}

	if( argv.restart ) {

		console.log('delete');
		pm2.delete( processName, function( error, proc ) {

			if( error ) {
				console.error( error );
				process.exit( ERROR_EXIT );
			}
			start();
		});

	} else {
		start();
	}
});

function start() {
	console.log('start');
	pm2.start( pm2script, function( error, apps ) {
			 
		if( error ) {
			console.error( error );
			process.exit( ERROR_EXIT );
		}

		console.log('start success');
		pm2.disconnect();
	});
}

_.each( pm2script.env, function( val, key ) {

	if( typeof val === 'string' ) return;

	// parse test
	try{
		JSON.parse( val );
	} catch( err ) {
		console.error( err );
	}
});
