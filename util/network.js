var logger = require('./logger.js');
var packets = require('../clubpenguin/packets/packets.js');
var penguin_class = require('../clubpenguin/penguin.js');
var room = require('../clubpenguin/room.js');
var net = require('net');
var event_emitter = require('events');
var cluster = require('cluster');
var Promise = require("bluebird");
var fs = require('fs');

class pack_emitter extends event_emitter {}

var packet_event = new pack_emitter;

global.world_type = undefined;
global.world_capacity = undefined;
global.world_id = undefined;
global.world_port = 0;
global.penguins = [];
global.penguinsById = {};
global.penguinsByNickname = {};

function start(address, port, type, capacity, id) {
	var server = net.createServer();

	server.on('connection', on_connection);
	server.listen(port, address);

	world_type = type;
	world_capacity = capacity;
	world_id = id;
	world_port = port;

	logger.log('Network Service Started', 'cyan');
}

function on_connection(conn) {
	logger.log('Connection > ' + conn.remoteAddress + ':' + conn.remotePort, 'cyan');

	conn.setTimeout(600000);
	conn.setEncoding('utf8');
	conn.setNoDelay(true);
	
	if((penguins.length + 1) >= world_capacity) {
		conn.end();
		conn.destroy();
		return logger.log('Server is too full. Players: ' + (penguins.length + 1), 'red');
	}

	let penguin = new penguin_class(conn);

	penguin.start();
	penguins.push(penguin);

	penguin.ipAddress = conn.remoteAddress;
	
	conn.on('data', (data) => {
		return on_data(penguin, data);
	});
	conn.on('error', (error) => {
		return on_error(penguin, error);
	});
	conn.on('timeout', () => {
		return on_timeout(penguin);
	});
	conn.once('close', () => {
		return on_close(penguin);
	});
}

function on_timeout(penguin) {
	penguin.send('e', -1, 2);
	
	logger.log('Connection Timeout', 'red');
	
	return removePenguin(penguin);
}

function on_data(penguin, data) {
	var chunked_array = data.split('\0');
	
	Promise.each(chunked_array, (raw_data) => {
		if(raw_data !== null && raw_data !== '') {
			logger.log('recieved > ' + raw_data, 'magenta');
			
			try {
				packets.decide(this, penguin, raw_data, world_type);
			} catch(error) {
				logger.log(error, 'red');
				return removePenguin(penguin);
			}
		}
	});
}

function on_close(penguin) {
	return removePenguin(penguin);
}

function on_error(penguin, error) {
	logger.log('error with socket > ' + error, 'red');
	
	return removePenguin(penguin);
}

function send_data(socket, data) {
	if(!socket.destroyed) {
		socket.write(data + "\0");
		logger.log('sent > ' + data, 'magenta');
	}
}

function disconnectPenguins(callback) {
	if(Object.keys(penguinsById).length == 0) {
		return callback();
	}

	for(var penguinId in Object.keys(penguinsById)) {
		let penguin = penguins[penguinId];

		if(penguin !== undefined && penguin.joined) {
			logger.log('Disconnecting ' + penguin.name(), 'red');
			removePenguin(penguin);
		}
	}
	
	callback();
}

function removePenguin(penguin) {
	try {
		if(penguins.indexOf(penguin) >= 0) {
			if(penguin.joined) {
				leaveWaddle(penguin);
				leaveTable(penguin);
				
				if(penguin.room !== undefined) {
					penguin.room.remove(penguin);
				}

				if(penguin.waddleId !== null) {
					let waddleEmit = 'LeaveGame-' + roomByWaddle[penguin.waddleId];

					WaddleEvent.emit(waddleEmit, penguin);
				}
				
				if(global.openIgloos[penguin.id] !== undefined) {
					delete global.openIgloos[penguin.id];
				}
				
				if(typeof(penguin.buddylist) == 'object') {
					Promise.each(Object.values(penguin.buddylist), (buddyObj) => {
						let buddyId = buddyObj.id;

						if(penguinsById[buddyId] !== undefined) {
							penguinsById[buddyId].send('bof', -1, penguin.id);
						}
					});
				}
				
				if(penguin.database !== undefined) {
					penguin.database.update_column(penguin.id, 'Online', 0);
					penguin.database.update_column(penguin.id, 'CurrentServer', 0);
					penguin.database.setWorldDataById(global.world_id, 'worldPopulation', (Object.keys(penguinsById).length - 1));
				}
			}
			
			delete penguinsById[penguin.id];
			delete penguinsByNickname[penguin.nickname];
			
			if(penguin.room !== undefined) { //double check
				penguin.room.remove(penguin);
			}
		
			let index = penguins.indexOf(penguin);
		
			penguins.splice(index, 1);
		
			if(penguin.socket !== undefined) {
				penguin.socket.end();
				penguin.socket.destroy();
			}
			
			logger.log('Penguin Disconnected', 'red');
		}
	} catch(erro) {
		logger.log('RP: ' + erro, 'red');
		
		fs.appendFile('NetworkError.txt', ("socket err --> " + erro + "\n\n"), function(error_str) {
			if(error_str) {
				logger.log(error_str, 'red');
			}
		});
	}
}

module.exports.start = start;
module.exports.send_data = send_data;
module.exports.removePenguin = removePenguin;
module.exports.penguins = penguins;
module.exports.world_type = world_type;
module.exports.pack_emitter = pack_emitter;
module.exports.disconnectPenguins = disconnectPenguins;
module.exports.penguinsById = penguinsById;
module.exports.penguinsByNickname = penguinsByNickname;