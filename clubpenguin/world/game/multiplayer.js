var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');

/* Multiplayer Games */
module.exports = function() {
	this.rinkPuck = ['0', '0', '0', '0'];
	this.gameByWaddle = [];
	
	this.handleStartGame = function(penguin, data) {
		if(penguin.inWaddle) {
			var waddleEmit = 'Join-' + roomByWaddle[penguin.waddleRoomId][penguin.waddleId];

			WaddleEvent.emit(waddleEmit, penguin);
		}

		if(penguin.tableId !== undefined) {
			var tableEmit = 'Join-' + gameByTable[penguin.tableId];

			TableEvent.emit(tableEmit, penguin);
		}
	}
	
	this.handleSendMove = function(penguin, data) {
		if(penguin.inWaddle) {
			var waddleEmit = 'Movement-' + roomByWaddle[penguin.waddleRoomId][penguin.waddleId];

			WaddleEvent.emit(waddleEmit, penguin, data);
		}

		if(penguin.tableId !== undefined) {
			var tableEmit = 'Movement-' + gameByTable[penguin.tableId];

			TableEvent.emit(tableEmit, penguin, data);
		}
	}
	
	this.handleLeaveGame = function(penguin, data) {
		if(penguin.inWaddle) {
			var waddleEmit = 'LeaveGame-' + roomByWaddle[penguin.waddleRoomId][penguin.waddleId];

			WaddleEvent.emit(waddleEmit, penguin);
		}

		if(penguin.tableId !== undefined) {
			var tableEmit = 'LeaveGame-' + gameByTable[penguin.tableId];

			TableEvent.emit(tableEmit, penguin);
		}
	}
	
	this.getGame = function(penguin, data) {
		if(penguin.room.external_id == 802) {
			return penguin.send('gz', penguin.room.internal_id, rinkPuck.splice(2, 2).join('%'));
		}

		if(penguin.inWaddle) {
			var waddleEmit = 'GetGame-' + roomByWaddle[penguin.waddleRoomId][penguin.waddleId];

			WaddleEvent.emit(waddleEmit, penguin);
		}

		if(penguin.tableId !== undefined) {
			var tableEmit = 'GetGame-' + gameByTable[penguin.tableId];

			TableEvent.emit(tableEmit, penguin);
		}
	}

	this.handleJoinMatchMaking = function(penguin, data) {
		var waddleEmit = 'JoinMatchMaking-' + penguin.room.external_id;

		WaddleEvent.emit(waddleEmit, penguin);
	}

	this.handleJoinSensei = function(penguin, data) {
		var waddleEmit = 'JoinSensei-' + penguin.room.external_id;

		WaddleEvent.emit(waddleEmit, penguin);
	}

	this.handleLeaveMatchMaking = function(penguin, data) {
		var waddleEmit = 'LeaveMatchMaking-' + penguin.room.external_id;

		WaddleEvent.emit(waddleEmit, penguin);
	}
	
	this.sendMovePuck = function(penguin, data) {
		if(penguin.room.external_id == 802) {
			if(data.length !== 5) {
				return network.removePenguin(penguin);
			}
			
			rinkPuck = data.splice(1);
			
			penguin.room.send(penguin, 'zm', penguin.room.internal_id, penguin.id, rinkPuck.join('%'));
		}
	}

	this.handleChangeDifficulty = function(penguin, data) {
		let emit = 'ChangeDifficulty-{0}'.format(penguin.room.external_id);

		WaddleEvent.emit(emit, penguin, data);
	}

	this.handleAbortGame = function(penguin, data) {
		let emit = 'AbortGame-{0}'.format(penguin.room.external_id);

		WaddleEvent.emit(emit, penguin, data);
	}
}