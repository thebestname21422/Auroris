var mysql_config = require('../../configurations/mysql.json');
var database = require('./database.js');
var remote_database = require('./remote.js');
var database_promise = require('./database_promise.js');
var error_handler = require('../../util/error_handler.js');
var mysqlPromise = require('mysql2/promise');
var dbEngine = require('./engine.js');

var databases = [];
var promiseConnection;
var mysql;
var engine;

async function start_engine() {
	let c = mysql_config['mysql'];
	let host = c['host'];
	let user = c['user'];
	let password = c['password'];
	let database = c['database'];

	promiseConnection = await mysqlPromise.createConnection({
        host: host,
        user: user,
        password: password,
        database: database
    });

    promiseConnection.on('error', error_handler.databaseError);

    engine = new dbEngine(promiseConnection, this);
}

async function start_connection() {
	let connectionLimit = global.serverSettings.dbConnections;

	await start_engine();

	mysql = new database();

	mysql.start(mysql_config['mysql'], global.serverSettings.dbConnections);
	mysql.engine = engine;
	
	remote = new remote_database();
	remote.start(mysql_config['remote']);

	global.mainDatabase = mysql;

	try {
		dependencyHandlers['message'].getFilter(global.mainDatabase);
	}
	catch(e) {
	}
}

function get_database() {
	return mysql;
}

function getRemoteDatabase() {
	if(remote.connection == null) {
		start_connection();
	}
	
	return remote;
}

module.exports.start_connection = start_connection;
module.exports.get_database = get_database;
module.exports.getRemoteDatabase = getRemoteDatabase;