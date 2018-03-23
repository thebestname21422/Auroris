var mysql = require('mysql');
var util = require('util');
var logger = require('../../util/logger.js');
var error_handler = require('../../util/error_handler.js');

function Database() {
    this.host;
    this.user;
    this.password;
    this.database;
    this.test_sql;
    this.connection;

    this.start = function(config) {
        var mysql = config;

        this.host = mysql['host'];
        this.user = mysql['user'];
        this.password = mysql['password'];
        this.database = mysql['database'];
        this.test_sql = mysql['test_sql'];

        this.start_connection();
		
		delete config;
		delete mysql;
    }

	this.start_connection = function() {
		if(this.host == null || this.user == null || this.password == null || this.database == null || this.test_sql == null) {
			return logger.log('database details incorrect.', 'red');
		}

		this.connection = mysql.createConnection({
			host: this.host,
			user: this.user,
			password: this.password,
			database: this.database
		});

		this.connection.connect = this.checkConnection();

		this.connection.on('error', error_handler.databaseError);
				
		this.dbHeartbeat();
		setInterval(this.dbHeartbeat.bind(this), 3.6e+6);
		
		delete this.host
		delete this.user
		delete this.password
		delete this.database
	}

    this.checkConnection = function(error) {
        if(error) {
            logger.log('could not connect to mysql', 'red');
            process.exit();
        }

        this.testConnection();
    }

	this.dbHeartbeat = function() {
		if(this.connection !== undefined) {
			this.connection.query('SELECT 1');
		}
	}

    this.testConnection = function() {
        this.connection.query(this.test_sql, function(error, result) {
            if(error !== null) {
                logger.log('could not connect to mysql', 'red');
                process.exit();
            }
        });
    }
	
	this.storeMessage = function(id, nickname, message, action) {
		var query = "INSERT INTO `chatlog` (`ID`, `PlayerID`, `PlayerNickname`, `Message`, `Timestamp`, `Action`) VALUES (NULL, ?, ?, ?, NULL, ?)";
		
		this.connection.query(query, [id, nickname, message, action], function(error, result) {
			if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
		});
	}
}

module.exports = Database;
