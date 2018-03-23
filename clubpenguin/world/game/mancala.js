let logger = require('../../../util/logger.js');
let network = require('../../../util/network.js');
let MancalaObject = require('./matches/mancala.js');
let Promise = require("bluebird");
let range = require("range").range;

/* Mancala Instance */
module.exports = function() {
	this.tablesById[100] = [];
	this.tablesById[101] = [];
	this.tablesById[102] = [];
	this.tablesById[103] = [];
	this.tablesById[104] = [];
	
	this.roomByTable[100] = 111;
	this.roomByTable[101] = 111;
	this.roomByTable[102] = 111;
	this.roomByTable[103] = 111;
	this.roomByTable[104] = 111;
	
	this.gameByTable[100] = 'Mancala';
	this.gameByTable[101] = 'Mancala';
	this.gameByTable[102] = 'Mancala';
	this.gameByTable[103] = 'Mancala';
	this.gameByTable[104] = 'Mancala';

	TableEvent.on('JoinTable-Mancala', (penguin, tableId, seatId) => {
		logger.log('Mancala::{0} is joining table {1}'.format(penguin.name(), tableId), 'cyan');

		if(Object.keys(tablesById[tableId]).length == 0) {
			gameByTableId[tableId] = new MancalaObject(penguin);
			tablePlayers[tableId] = {};
		}

		tablePlayers[tableId][seatId] = penguin;
		tablesById[tableId][seatId] = penguin.name();

		penguin.tableId = tableId;
		penguin.playerSeat = seatId;

		penguin.send('jt', penguin.room.internal_id, tableId, Number(seatId) + 1);
		penguin.room.send(penguin, 'ut', penguin.room.internal_id, tableId, Number(seatId) + 1);
	});

	TableEvent.on('GetGame-Mancala', (penguin) => {
		let playerNames = range(2).map(i => tablesById[penguin.tableId][i]).join('%');
		let boardString = gameByTableId[penguin.tableId].boardToString();
		
		penguin.send('gz', penguin.room.internal_id, playerNames, boardString);
	});

	TableEvent.on('Join-Mancala', (penguin) => {
		let seatId = penguin.playerSeat;
		
		if(seatId == null || isNaN(seatId)) return;
		
		penguin.send('jz', penguin.room.internal_id, seatId);

		gameByTableId[penguin.tableId].addPlayer(penguin);

		for(let seat in tablePlayers[penguin.tableId]) {
			let player = tablePlayers[penguin.tableId][seat];

			player.send('uz', penguin.room.internal_id, seatId, penguin.name());

			if(seatId == 1) player.send('sz', penguin.room.internal_id, gameByTableId[penguin.tableId].seatTurn);
		}
	});

	TableEvent.on('Movement-Mancala', (penguin, data) => {
		if(data.length < 1) return;
		if(tablePlayers[penguin.tableId].length < 2) return;
		if(penguin.playerSeat > 1) return;

		let match = gameByTableId[penguin.tableId] || null;
		let obj = {seat: penguin.playerSeat, cup: data[0]};

		if(isNaN(obj.cup)) return;

		for(let seat in tablePlayers[penguin.tableId]) {
			let player = tablePlayers[penguin.tableId][seat];

			player.send('zm', player.room.internal_id, Object.values(obj).join('%'));
		}

		if(match !== null) match.movement(penguin, obj);
	});
}