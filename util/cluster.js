var cluster = require('cluster');
var os = require('os');
var network = require('./network.js');
var packets = require('../clubpenguin/packets/packets.js');
var workers = [];

function setup(networkDetails, logger, database, error_handler) {
	[address, port, type, capacity, id, threads] = networkDetails;
	
	global.world_id = id;
	
	switch(cluster.isMaster) {
		case true:
			masterProcess(networkDetails, logger, database, error_handler);
		break;
		case false:
			forkProcess(networkDetails, logger, database, error_handler);
		break;
	}
}

function masterProcess(networkDetails, logger, database, error_handler) {
	for(var index = 0; index < threads; index += 1) {
		var fork = cluster.fork();
		
		workers.push(fork);
	}
	
	logger.start();
	database.start_connection();
	packets.start(true);
	error_handler.start(true);
	
	cluster.on('exit', function() {
		cluster.fork();
	});
		
	logger.log('Cluster::Spawned ' + threads + ' Threads', 'cyan');
	logger.log('Cluster-Network Service Started', 'cyan');
}

function forkProcess(networkDetails, logger, database, error_handler) {
	error_handler.start(false);
	network.start(address, port, type, capacity, id);
}

module.exports.setup = setup;
module.exports.workers = workers;