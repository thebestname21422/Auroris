var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var Match = require('./matches/cardfire.js');
var Promise = require("bluebird");
var room = require('../../room.js');

/* Card Jitsu Fire Waddles */
module.exports = function() {
	this.waddlesById[812] = {};

	this.waddleConnections[812] = {};

	this.waddlePlayers[812] = {};

	this.waddlePlayerStrings[812] = {};

	this.roomByWaddle[812] = {};

	this.waddlesById[812][300] = ['', ''];
	this.waddlesById[812][301] = ['', ''];
	this.waddlesById[812][302] = ['', '', ''];
	this.waddlesById[812][303] = ['', '', '', ''];
	
	this.waddleConnections[812][300] = [false, false];
	this.waddleConnections[812][301] = [false, false];
	this.waddleConnections[812][302] = [false, false, false];
	this.waddleConnections[812][303] = [false, false, false, false];
	
	this.roomByWaddle[812][300] = 997;
	this.roomByWaddle[812][301] = 997;
	this.roomByWaddle[812][302] = 997;
	this.roomByWaddle[812][303] = 997;
	
	this.cardDeals = [1, 5];
	
	require('./multiplayer.js')();
	
	WaddleEvent.on('StartWaddle-997', (externalId, waddleId, waddleRoomId) => {
		logger.log('Starting Card Jitsu Fire Battle [' + waddleId + ']', 'green');

		var roomId = roomByWaddle[waddleRoomId][waddleId];
		var seatCount = waddlePlayers[waddleRoomId][waddleId].length;
		
		var player1 = waddlePlayers[waddleRoomId][waddleId][0];
		var player2 = waddlePlayers[waddleRoomId][waddleId][1];
				
		for(var _index in waddlePlayers[waddleRoomId][waddleId]) {
			var player = waddlePlayers[waddleRoomId][waddleId][_index];

			player.waddleId = waddleId;
			player.waddleRoom = externalId;
			player.playerSeat = _index;

			player.send('sw', player.room.internal_id, roomId, externalId, seatCount);
		}

		gameByWaddle[externalId] = new Match([player1, player2], externalId);

		for(var index in waddlesById[waddleRoomId][waddleId]) {
			waddlesById[waddleRoomId][waddleId][index] = '';
		}

		waddlePlayers[waddleRoomId][waddleId] = [];
	});
	
	WaddleEvent.on('Movement-997', (penguin, data) => {
		console.log('Movement', data);
		let movementType = data[0];

		gameByWaddle[penguin.waddleRoom].sendMovementMessage(penguin, movementType, data.splice(1));
	});
	
	WaddleEvent.on('GetGame-997', (penguin) => {
		penguin.send('gz', penguin.room.internal_id, 2, gameByWaddle[penguin.waddleRoom].playerAmount);

		waddleConnections[penguin.waddleRoomId][penguin.waddleId][penguin.playerSeat] = true;

		penguin.send('jz', penguin.room.internal_id, penguin.playerSeat);

		if(waddleConnections[penguin.waddleRoomId][penguin.waddleId].indexOf(false) == -1) {
			gameByWaddle[penguin.waddleRoom].initMatch();
			gameByWaddle[penguin.waddleRoom].startGameMessage(penguin);
		}
	});
	
	WaddleEvent.on('LeaveGame-997', (penguin) => {
		logger.log(penguin.name() + ' is leaving CJ Fire match', 'red');

		//need to support up to 4 players!!

		if(!gameByWaddle[penguin.waddleRoom].completed) {
			gameByWaddle[penguin.waddleRoom].completed = true;

			penguin.room.send(penguin, 'cz', penguin.waddleRoom, penguin.name());

			return;
		}

		penguin.send('lz', penguin.waddleRoom, penguin.playerSeat); //temp
	});
}