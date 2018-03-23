var fs = require('fs');
var logger = require('./logger.js');
var network = require('./network.js');
var cluster = require('./cluster.js');

function start(show) {	
	process.on('uncaughtException', fatalError);
	process.on('SIGINT', endServer);
}

function fatalError(error) {
	if(typeof(error) == 'object') {
		if(error.message) {
			logger.log(error.message, 'red');
			
			var final_message = "fatal log > " + logger.getDateString() + error;
			
			if(error.stack) {
				final_message = "fatal log > " + logger.getDateString() + error.stack;
			}
			
			fs.appendFile('fatal.txt', (final_message + "\n"), function(error_str) {
				if(error_str) {
					logger.log(error_str, 'red');
				}
				
				//process.exit(1); //try to keep server up but log msg
			});
		}
	}
}

function endWorkers() {
	for(var id in cluster.workers) {
		logger.log('Killing Worker #' + (Number(id) + 1), 'red');
		cluster.workers[id].kill();
	}
}

function endServer() {
	network.disconnectPenguins(function() {
		endWorkers();
		process.exit(1);
	});
}

function databaseError(error) {
	logger.log('Database error > ' + error, 'red');
	
	fatalError(error);
}

module.exports.start = start;
module.exports.fatalError = fatalError;
module.exports.databaseError = databaseError;