var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var room = require('../../room.js');
var Promise = require("bluebird");
var EventEmitter = require('events');

/* Games - z# */
module.exports = function() {
	this.roomByWaddle = {};
	this.waddlesById = {};
	this.waddlePlayers = {};
	this.waddleRooms = {};
	this.waddleConnections = {};
	this.waddlePlayerStrings = {};
	this.waddleRoomId = 9;
	
	WaddleEvent = new EventEmitter();
	
	require('./sledracing.js')();
	require('./cardjitsu.js')();
	require('./cardjitsufire.js')();
	require('./cardjitsuwater.js')();
	require('./dancecontest.js')();
	require('./multiplayer.js')();

	this.handleGetWaddles = async function(penguin, data, room = false) {
		let waddleIds = data;
		let roomId = penguin.room.external_id;
		let waddlePopulation = await Promise.map(waddleIds, (wid) => [wid, waddlesById[roomId][wid].join(',')].join('|'));
		
		if(room == true) {
			penguin.room.send(penguin, 'gw', penguin.room.internal_id, waddlePopulation.join('%'));
		} else {
			penguin.send('gw', penguin.room.internal_id, waddlePopulation.join('%'));
		}
	}
	
	this.handleSendJoinWaddleById = function(penguin, data) {
		let waddleId = data[0];
		let penguinSeat = waddlesById[penguin.room.external_id][waddleId].indexOf('');
		
		if(penguin.inWaddle) return leaveWaddle(penguin);
		
		leaveWaddle(penguin);

		if(penguinSeat == -1) {
			return logger.log('Waddle {0} is full ({1})'.format(waddleId, penguin.name()), 'red');
		}

		if(waddlesById[penguin.room.external_id][waddleId][penguinSeat] == undefined) {
			return logger.log('Waddle {0} is full ({1})'.format(waddleId, penguin.name()), 'red');
		}
		
		if(waddlesById[penguin.room.external_id][waddleId][penguinSeat] !== '') {
			return logger.log('Waddle Space is taken {0} ({1})'.format(waddleId, penguin.name()), 'red');
		}

		if(penguinSeat > waddlesById[penguin.room.external_id][waddleId].length) {
			return logger.log('Waddle {0} is full ({1})'.format(waddleId, penguin.name()), 'red');
		}

		if(waddlePlayers[penguin.room.external_id][waddleId] == undefined) {
			waddlePlayers[penguin.room.external_id][waddleId] = [];
		}
		
		waddlePlayers[penguin.room.external_id][waddleId][penguinSeat] = penguin;
		waddlesById[penguin.room.external_id][waddleId][penguinSeat] = penguin.name();
		
		penguin.inWaddle = true;
		penguin.waddleRoomId = penguin.room.external_id;
		
		penguin.send('jw', penguin.room.internal_id, penguinSeat);
		
		penguin.room.send(penguin, 'uw', penguin.room.internal_id, waddleId, penguinSeat, penguin.name());

		if(waddlesById[penguin.room.external_id][waddleId].indexOf('') == -1) {
			startWaddle(penguin, waddleId);
		}
	}
	
	this.startWaddle = function(penguin, waddleId) {
		waddleRoomId++;
		
		if(roomByWaddle[penguin.room.external_id][waddleId] == undefined) {
			return logger.log('Game Room is not defined', 'red');
		}
		
		var roomId = roomByWaddle[penguin.room.external_id][waddleId];
		var externalId = Math.floor(((waddleRoomId + waddleId + roomId + penguin.id) * 12) / 10);
		var internalId = global.rooms[roomId].internal_id;
		var seatCount = waddlesById[penguin.room.external_id][waddleId].length;
				
		if(global.rooms[externalId] == undefined) {
			waddleRooms[externalId] = new room(roomId, internalId, seatCount, false, false, 'WaddleGame', false);
		} else {
			return logger.log('Waddle room already exists.', 'red');
		}
		
		waddlePlayerStrings[penguin.room.external_id][waddleId] = [];
		
		var eventEmit = 'StartWaddle-' + String(roomId);
		WaddleEvent.emit(eventEmit, externalId, waddleId, penguin.room.external_id);

		handleGetWaddles(penguin, Object.keys(waddlesById[penguin.room.external_id]), true);
	}
	
	this.joinWaddle = function(penguin, data) {
		var roomId = Number(data[0]);
		
		penguin.send('jx', penguin.room.internal_id, roomId);
		penguin.room.remove(penguin);
		
		if(penguin.waddleRoom !== null) {
			if(waddleRooms[penguin.waddleRoom] !== undefined) {
				waddleRooms[penguin.waddleRoom].add(penguin);
			}
		}
	}
	
	this.handleLeaveWaddle = function(penguin, data) {
		leaveWaddle(penguin);
	}
	
	this.leaveWaddle = function(penguin) {
		for(var index in waddlePlayers[penguin.room.external_id]) {
			for(var _index in waddlePlayers[penguin.room.external_id][index]) {
				if(penguin == waddlePlayers[penguin.room.external_id][index][_index]) {
					var waddleId = index;
					var penguinSeat = _index;
					
					if(waddlesById[penguin.room.external_id][waddleId][penguinSeat] !== undefined) {
						waddlesById[penguin.room.external_id][waddleId][penguinSeat] = '';
					}
										
					penguin.room.send(penguin, 'uw', penguin.room.internal_id, waddleId, penguinSeat);
					
					break;
				}
			}
		}
		
		//penguin.waddleRoom = null;
		//penguin.waddleId = null;
		penguin.playerSeat = null;
		penguin.inWaddle = false;
		penguin.waddleRoomId = penguin.room.external_id;
	}
}