var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var Match = require('./matches/cardfire.js');
var Promise = require("bluebird");
var room = require('../../room.js');

/* Card Jitsu Water Waddles */
module.exports = function() {
	this.waddlesById[816] = {};

	this.waddleConnections[816] = {};

	this.waddlePlayers[816] = {};

	this.waddlePlayerStrings[816] = {};

	this.roomByWaddle[816] = {};

	this.waddlesById[816][300] = ['', ''];
	this.waddlesById[816][301] = ['', ''];
	this.waddlesById[816][302] = ['', '', ''];
	this.waddlesById[816][303] = ['', '', '', ''];
	
	this.waddleConnections[816][300] = [false, false];
	this.waddleConnections[816][301] = [false, false];
	this.waddleConnections[816][302] = [false, false, false];
	this.waddleConnections[816][303] = [false, false, false, false];
	
	this.roomByWaddle[816][300] = 995;
	this.roomByWaddle[816][301] = 995;
	this.roomByWaddle[816][302] = 995;
	this.roomByWaddle[816][303] = 995;
	
	require('./multiplayer.js')();
	
	WaddleEvent.on('StartWaddle-995', (externalId, waddleId, waddleRoomId) => {
		logger.log('Starting Card Jitsu Fire Battle [' + waddleId + ']', 'green');

		var roomId = roomByWaddle[waddleRoomId][waddleId];
		var seatCount = waddlePlayers[waddleRoomId][waddleId].length;
		
		var player1 = waddlePlayers[waddleRoomId][waddleId][0];
		var player2 = waddlePlayers[waddleRoomId][waddleId][1];
				
		for(var index in waddlesById[waddleRoomId][waddleId]) {
			waddlesById[waddleRoomId][waddleId][index] = '';
		}

		for(var _index in waddlePlayers[waddleRoomId][waddleId]) {
			var player = waddlePlayers[waddleRoomId][waddleId][_index];

			player.waddleId = waddleId;
			player.waddleRoom = externalId;
			player.playerSeat = _index;

			player.send('sw', player.room.internal_id, roomId, externalId, seatCount);
		}

		waddlePlayers[waddleRoomId][waddleId] = [];

		//gameByWaddle[externalId] = new Match([player1, player2]);
	});
	
	WaddleEvent.on('Join-995', (penguin) => {
	});
	
	WaddleEvent.on('Movement-995', (penguin, data) => {
	});
	
	WaddleEvent.on('GetGame-995', (penguin) => {
		penguin.send('gz', penguin.room.internal_id, 2, 2); //player amount
		penguin.send('jz', penguin.room.internal_id, penguin.playerSeat);
	});
	
	WaddleEvent.on('LeaveGame-995', (penguin) => {
		logger.log(penguin.name() + ' is leaving CJ match', 'red');
	});
}