var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var range = require("range").range;

/* Sled Racing Instance */
module.exports = function() {
	this.waddlesById[230] = {};
	this.waddlesById[230][100] = ['', '', '', ''];
	this.waddlesById[230][101] = ['', '', ''];
	this.waddlesById[230][102] = ['', ''];
	this.waddlesById[230][103] = ['', ''];
	
	this.waddleConnections[230] = {};
	this.waddleConnections[230][100] = [false, false, false, false];
	this.waddleConnections[230][101] = [false, false, false];
	this.waddleConnections[230][102] = [false, false];
	this.waddleConnections[230][103] = [false, false];

	this.waddlePlayers[230] = {};

	this.waddlePlayerStrings[230] = {};

	this.roomByWaddle[230] = {};
	
	this.roomByWaddle[230][100] = 999;
	this.roomByWaddle[230][101] = 999;
	this.roomByWaddle[230][102] = 999;
	this.roomByWaddle[230][103] = 999;

	WaddleEvent.on('StartWaddle-999', (externalId, waddleId, waddleRoomId) => {
		logger.log('Starting Sled Race [{0}]'.format(waddleId), 'green');
		
		let roomId = roomByWaddle[waddleRoomId][waddleId];
		let seatCount = waddlePlayers[waddleRoomId][waddleId].length;

		for(var index in waddlePlayers[waddleRoomId][waddleId]) {
			let player = waddlePlayers[waddleRoomId][waddleId][index];
			
			player.waddleId = waddleId;
			player.waddleRoom = externalId;
			player.playerSeat = index;
			player.send('sw', player.room.internal_id, roomId, externalId, seatCount);
		}

		let waddleLength = waddleConnections[waddleRoomId][waddleId].length;

		waddlesById[waddleRoomId][waddleId] = range(waddleLength).map(w => '');

		waddlePlayers[waddleRoomId][waddleId] = [];
	});
	
	WaddleEvent.on('Join-999', (penguin) => {
		logger.log('{0} is joining a Sled Race'.format(penguin.name()), 'green');
		
		let waddleLength = waddleConnections[penguin.waddleRoomId][penguin.waddleId].length;
		let playerString = [penguin.name(), penguin.colour, penguin.hand, penguin.name()];
		
		waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId][penguin.playerSeat] = playerString.join('|');
		waddleConnections[penguin.waddleRoomId][penguin.waddleId][penguin.playerSeat] = true;
		
		if(waddleConnections[penguin.waddleRoomId][penguin.waddleId].indexOf(false) == -1) {
			let waddleLength = waddleConnections[penguin.waddleRoomId][penguin.waddleId].length;

			logger.log('connection length: {0}'.format(waddleLength), 'cyan');

			penguin.room.send(penguin, 'uz', penguin.room.internal_id, waddleLength, waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId].join('%'));
			
			waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId] = [];
			waddleConnections[penguin.waddleRoomId][penguin.waddleId] = range(waddleLength).map(w => false); //reset connections
		}
	});
	
	WaddleEvent.on('Movement-999', (penguin, data) => {
		if(isNaN(data[0])) return;
		if(data[0] != penguin.playerSeat) return; //hax

		penguin.room.send(penguin, 'zm', penguin.room.internal_id, data.join('%'));
	});
}