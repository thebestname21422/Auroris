var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var FindFour = require('./matches/find.js');
var Promise = require("bluebird");

/* Find Four Instance */
module.exports = function() {
	this.tablesById[200] = [];
	this.tablesById[201] = [];
	this.tablesById[202] = [];
	this.tablesById[203] = [];
	this.tablesById[204] = [];
	this.tablesById[205] = [];
	this.tablesById[206] = [];
	this.tablesById[207] = [];
	
	this.roomByTable[200] = 221;
	this.roomByTable[201] = 221;
	this.roomByTable[202] = 221;
	this.roomByTable[203] = 221;
	this.roomByTable[204] = 221;
	this.roomByTable[205] = 220;
	this.roomByTable[206] = 220;
	this.roomByTable[207] = 220;
	
	this.gameByTable[200] = 'FindFour';
	this.gameByTable[201] = 'FindFour';
	this.gameByTable[202] = 'FindFour';
	this.gameByTable[203] = 'FindFour';
	this.gameByTable[204] = 'FindFour';
	this.gameByTable[205] = 'FindFour';
	this.gameByTable[206] = 'FindFour';
	this.gameByTable[207] = 'FindFour';
	
	TableEvent.on('JoinTable-FindFour', (penguin, tableId, seatId) => {
		logger.log(penguin.name() + ' is joining a Find Four match', 'green');
		
		if(tablesById[tableId].length == 0) {
			gameByTableId[tableId] = new FindFour();
			tablePlayers[tableId] = {};
		}
		
		tablePlayers[tableId][seatId] = penguin;
		tablesById[tableId][seatId] = penguin.name();
		
		penguin.tableId = tableId;
		penguin.playerSeat = seatId;
		
		penguin.send('jt', penguin.room.internal_id, tableId, Number(seatId + 1));
		penguin.room.send(penguin, 'ut', penguin.room.internal_id, tableId, Number(seatId + 1));
	});
	
	TableEvent.on('GetGame-FindFour', (penguin) => {
		let firstPlayer = tablesById[penguin.tableId][0];
		let secondPlayer = tablesById[penguin.tableId][1];
		let board = gameByTableId[penguin.tableId].boardToString();

		if(tablesById[penguin.tableId].length > 2) board = [board, 1].join('%');
		
		penguin.send('gz', penguin.room.internal_id, firstPlayer, secondPlayer, board);
	});
	
	TableEvent.on('Join-FindFour', (penguin) => {
		let seatId = penguin.playerSeat;
		
		if(seatId == null || isNaN(seatId)) return;
		
		penguin.send('jz', penguin.room.internal_id, seatId);

		if(seatId == 1) {
			gameByTableId[penguin.tableId].players = [tablePlayers[penguin.tableId][0], tablePlayers[penguin.tableId][1]];
		} else if(seatId > 1) {
			gameByTableId[penguin.tableId].spectators.push(penguin);
		}

		for(let seat in tablePlayers[penguin.tableId]) {
			let player = tablePlayers[penguin.tableId][seat];

			player.send('uz', penguin.room.internal_id, seatId, penguin.name());

			if(seatId == 1) player.send('sz', penguin.room.internal_id);
		}
	});

	TableEvent.on('Movement-FindFour', (penguin, data) => {
		if(data.length != 2) return;
		if(tablePlayers[penguin.tableId].length < 2) return;
		if(penguin.playerSeat > 1) return;

		let match = gameByTableId[penguin.tableId] || null;
		let obj = {seat: penguin.playerSeat, column: data[0], row: data[1]};
		let move;

		if(isNaN(obj.column) || isNaN(obj.row)) return;

		if(match !== null) move = match.movement(penguin, obj);

		if(move == false) return;

		for(let seat in tablePlayers[penguin.tableId]) {
			let player = tablePlayers[penguin.tableId][seat];

			player.send('zm', player.room.internal_id, Object.values(obj).join('%'));
		}
	});

	TableEvent.on('LeaveGame-FindFour', (penguin) => { //handled in table.js
	});
}