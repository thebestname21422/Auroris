const mysql = require('mysql2');
const mysqlPromise = require('mysql2/promise');
const util = require('util');
const logger = require('../../util/logger.js');
const error_handler = require('../../util/error_handler.js');
const dbEngine = require('./engine.js');

function Database() {
    this.host;
    this.user;
    this.password;
    this.database;
    this.promiseConnection;
    this.engine;

    this.start = async function(config) {
        var mysql = config;

        this.host = mysql['host'];
        this.user = mysql['user'];
        this.password = mysql['password'];
        this.database = mysql['database'];

        this.promiseConnection = await mysqlPromise.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database
        });

        this.promiseConnection.on('error', error_handler.databaseError);

        this.engine = new dbEngine(this.promiseConnection, this);

        delete this.host
        delete this.user
        delete this.password
        delete this.database		
		delete config;
		delete mysql;
    }
}

module.exports = Database;
