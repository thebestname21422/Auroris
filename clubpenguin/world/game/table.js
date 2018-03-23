var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var room = require('../../room.js');
var EventEmitter = require('events');
var Promise = require("bluebird");

/* Tables */
module.exports = function() {
	this.tablesById = {};
	this.tablePlayers = {};
	this.gameByTableId = {};
	this.roomByTable = {};
	this.gameByTable = {};

	this.TABLE_LIMIT = 10; //10 times IN THE SAME ROOM??
	
	TableEvent = new EventEmitter();
	
	require('./findfour.js')();
	require('./mancala.js')();
	
	this.handleGetTables = async function(penguin, data) {
		if(data.length > TABLE_LIMIT) return network.removePenguin(penguin); //exploit
		if((data.map(tid => isNaN(tid))).indexOf(true) >= 0) return network.removePenguin(penguin); //exploit

		let tableIds = data.map(Number);
		let tablePopulation = (await Promise.map(tableIds, tid => [tid, tablesById[tid].length].join('|'))).join('%');

		penguin.send('gt', penguin.room.internal_id, tablePopulation);
	}
	
	this.handleJoinTable = function(penguin, data) {
		if(isNaN(data[0])) return;
		if(penguin.inWaddle) return;
		if(penguin.tableId !== null) return leaveTable(penguin);
		
		leaveWaddle(penguin);
		leaveTable(penguin);
		
		let tableId = Number(data[0]);
		let seatId = tablesById[tableId].length;
		let game = gameByTable[tableId];

		if(game == undefined) return;
		
		let eventEmit = 'JoinTable-' + String(game);
		TableEvent.emit(eventEmit, penguin, tableId, seatId);
	}
	
	this.handleLeaveTable = function(penguin, data) {
		leaveTable(penguin);
	}
	
	this.leaveTable = function(penguin) {
		if(penguin.tableId == null) return;
		if(penguin.playerSeat == null) return;

		penguin.send('lt', penguin.room.internal_id);
		
		if(tablesById[penguin.tableId].length > 1) penguin.room.send(penguin, 'ut', penguin.room.internal_id, penguin.tableId, Number(penguin.playerSeat));

		let game = gameByTableId[penguin.tableId];

		if(game == undefined) {
			penguin.tableId = null;
			return;
		}

		if(penguin.playerSeat > 1) {
			delete tablePlayers[penguin.tableId][penguin.playerSeat];

			let _ind = game.spectators.indexOf(penguin);

			if(_ind >= 0 ) game.spectators.splice(_ind);

			penguin.tableId = null;

			return;
		}
		
		let opponentSeatId = penguin.playerSeat == 0 ? 1 : 0;
		
		if(tablePlayers[penguin.tableId][opponentSeatId] !== undefined && game.finished == false) {
			tablePlayers[penguin.tableId][opponentSeatId].addCoins(10);
		}

		if(tablesById[penguin.tableId].length > 1 && game.finished == false) {
			for(let seat in tablePlayers[penguin.tableId]) {
				let player = tablePlayers[penguin.tableId][seat];

				player.send('cz', player.room.internal_id, penguin.name());
			}
		}

		tablesById[penguin.tableId] = [];

		delete tablePlayers[penguin.tableId];
		delete gameByTableId[penguin.tableId];

		penguin.room.send(penguin, 'ut', penguin.room.internal_id, penguin.tableId, 0);
		
		penguin.tableId = null;
	}
}