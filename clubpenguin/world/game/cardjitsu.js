var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var Match = require('./matches/card.js');
var SenseiMatch = require('./matches/sensei.js');
var Promise = require("bluebird");
var room = require('../../room.js');
var range = require("range").range;

/* Card Jitsu Instance */
module.exports = function() {
	this.waddlesById[320] = {};
	this.waddlesById[322] = {};

	this.waddleConnections[320] = {};
	this.waddleConnections[322] = {};

	this.waddlePlayers[320] = {};
	this.waddlePlayers[322] = {};

	this.waddlePlayerStrings[320] = {};
	this.waddlePlayerStrings[322] = {};

	this.roomByWaddle[320] = {};
	this.roomByWaddle[322] = {};

	this.waddlesById[320][200] = ['', ''];
	this.waddlesById[320][201] = ['', ''];
	this.waddlesById[320][202] = ['', ''];
	this.waddlesById[320][203] = ['', ''];
	this.waddlesById[320][204] = ['', ''];

	this.waddlesById[322][200] = ['', ''];
	this.waddlesById[322][201] = ['', ''];
	this.waddlesById[322][202] = ['', ''];
	this.waddlesById[322][203] = ['', ''];
	this.waddlesById[322][204] = ['', ''];
	
	this.waddleConnections[320][200] = [false, false];
	this.waddleConnections[320][201] = [false, false];
	this.waddleConnections[320][202] = [false, false];
	this.waddleConnections[320][203] = [false, false];
	this.waddleConnections[320][204] = [false, false];

	this.waddleConnections[322][200] = [false, false];
	this.waddleConnections[322][201] = [false, false];
	this.waddleConnections[322][202] = [false, false];
	this.waddleConnections[322][203] = [false, false];
	this.waddleConnections[322][204] = [false, false];
	
	this.roomByWaddle[320][200] = 998;
	this.roomByWaddle[320][201] = 998;
	this.roomByWaddle[320][202] = 998;
	this.roomByWaddle[320][203] = 998;
	this.roomByWaddle[320][204] = 998; //matchmaking
	this.roomByWaddle[320][1172] = 998;

	this.roomByWaddle[322][200] = 998;
	this.roomByWaddle[322][201] = 998;
	this.roomByWaddle[322][202] = 998;
	this.roomByWaddle[322][203] = 998;

	this.waddlePlayers[320][204] = [];

	this.cardDeals = [1, 5];

	this.matchQueue = [];
	this.matchCountdown = null;
	this.currentTick = 5;
	this.jitsuWaddleId = 204;

	this.senseiWaddleId = 1172;
	
	require('./multiplayer.js')();
	
	WaddleEvent.on('StartWaddle-998', (externalId, waddleId, waddleRoomId) => {
		logger.log('Starting Card Jitsu Battle [' + waddleId + ']', 'green');
		
		var roomId = roomByWaddle[waddleRoomId][waddleId];
		var seatCount = waddlePlayers[waddleRoomId][waddleId].length;
		
		var player1 = waddlePlayers[waddleRoomId][waddleId][0];
		var player2 = waddlePlayers[waddleRoomId][waddleId][1];
				
		for(var _index in waddlePlayers[waddleRoomId][waddleId]) {
			var player = waddlePlayers[waddleRoomId][waddleId][_index];

			player.waddleId = waddleId;
			player.waddleRoom = externalId;
			player.playerSeat = _index;

			player.send('scard', player.room.internal_id, roomId, externalId, seatCount);
			player.send('sw', player.room.internal_id, roomId, externalId, seatCount);
		}

		gameByWaddle[externalId] = new Match([player1, player2]);

		let waddleLength = waddleConnections[waddleRoomId][waddleId].length;

		waddlesById[waddleRoomId][waddleId] = range(waddleLength).map(w => '');

		waddlePlayers[waddleRoomId][waddleId] = [];
	});
	
	WaddleEvent.on('Join-998', (penguin) => {
		logger.log(penguin.name() + ' is joining a Card Jitsu Battle', 'green');
		
		let playerString = [penguin.playerSeat, penguin.name(), penguin.colour, penguin.belt];
		let senseiString = [0, 'Sensei', 14, 0];
		
		penguin.send('jz', penguin.room.internal_id, playerString.join('%'));

		if(penguin.senseiBattle) {
			waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId].push(senseiString.join('|'));
		}
		
		waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId].push(playerString.join('|'));
		waddleConnections[penguin.waddleRoomId][penguin.waddleId][penguin.playerSeat] = true;
		
		if(waddleConnections[penguin.waddleRoomId][penguin.waddleId].indexOf(false) == -1) {
			penguin.room.send(penguin, 'uz', penguin.room.internal_id, waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId].join('%'));
			
			gameByWaddle[penguin.waddleRoom].initMatch();
			
			penguin.room.send(penguin, 'sz', penguin.room.internal_id);

			waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId] = [];
			waddleConnections[penguin.waddleRoomId][penguin.waddleId] = [false, false]; //only 2 players
		}
	});
	
	WaddleEvent.on('Movement-998', (penguin, data) => {
		var moveType = data[0];
		var moveArgument = data[1];
		
		if(isNaN(moveArgument)) {
			return;
		}
		
		switch(moveType) {
			case 'deal':
				if(cardDeals.indexOf(Number(moveArgument)) >= 0) {
					gameByWaddle[penguin.waddleRoom].dealCards(penguin, Number(moveArgument));
				}
				break;

			case 'pick':
				gameByWaddle[penguin.waddleRoom].pickCard(penguin, Number(moveArgument));
				break;
		}
	});
	
	WaddleEvent.on('GetGame-998', (penguin) => {
		penguin.send('gz', penguin.room.internal_id, 2, 2); //u can only have 2 players
	});
	
	WaddleEvent.on('LeaveGame-998', (penguin) => {
		logger.log(penguin.name() + ' is leaving CJ match', 'red');

		if(penguin.waddleRoom == null || penguin.waddleRoom == undefined) {
			return logger.log('Invalid waddle room ID.', 'red');
		}

		if(penguin.waddleId == 0 || penguin.waddleId == undefined) {
			return logger.log('Invalid waddle ID.', 'red');
		}
		
		if(!gameByWaddle[penguin.waddleRoom].completed) {
			gameByWaddle[penguin.waddleRoom].completed = true;
			
			penguin.room.send(penguin, 'cz', penguin.waddleRoom, penguin.name());
			
			penguin.playerSeat = null;
			penguin.senseiBattle = false;
			penguin.inWaddle = false;
			
			return;
		}
		
		penguin.send('lz', penguin.waddleRoom, penguin.playerSeat);

		penguin.playerSeat = null;
		penguin.senseiBattle = false;
		penguin.inWaddle = false;
	});

	WaddleEvent.on('JoinMatchMaking-951', (penguin) => {
		if(matchQueue.indexOf(penguin) >= 0) {
			return logger.log(penguin.name() + ' is already in queue.', 'red');
		}

		let waddleId = penguin.room.internal_id;
		let externalId = penguin.room.external_id;

		roomByWaddle[externalId] = {};
		waddleConnections[externalId] = {};
		waddlesById[externalId] = {};
		waddlePlayers[externalId] = {};
		waddlePlayerStrings[externalId] = {};

		roomByWaddle[externalId][waddleId] = 998;
		waddleConnections[externalId][waddleId] = [false, false];
		waddlesById[externalId][waddleId] = ['', ''];
		waddlePlayers[externalId][waddleId] = {};

		matchQueue.push(penguin);

		/*if(matchQueue.length > 2) {
			matchQueue = []; //reset
		}*/

		if(matchQueue.length >= 2) {
			[firstPlayer, secondPlayer] = matchQueue;

			if(firstPlayer == null || secondPlayer == null) {
				return logger.log('One of the player objects are null.', 'red');
			}

			if(firstPlayer.id !== penguin.id && secondPlayer.id !== penguin.id) {
				return logger.log('Not any of the players.', 'red');
			}

			let names = [firstPlayer.name(), secondPlayer.name()];

			firstPlayer.send('tmm', firstPlayer.room.internal_id, -1, names.reverse().join('%'));
			secondPlayer.send('tmm', secondPlayer.room.internal_id, -1, names.join('%'));

			waddlePlayers[externalId][waddleId][0] = firstPlayer;
			waddlesById[externalId][waddleId][0] = firstPlayer.name();

			waddlePlayers[externalId][waddleId][1] = secondPlayer;
			waddlesById[externalId][waddleId][1] = secondPlayer.name();

			firstPlayer.waddleRoomId = externalId;
			secondPlayer.waddleRoomId = externalId;

			firstPlayer.inWaddle = true;
			secondPlayer.inWaddle = true;

			matchQueue = matchQueue.filter(p => p !== firstPlayer);
			matchQueue = matchQueue.filter(p => p !== secondPlayer);

			return startWaddle(penguin, waddleId);
		} else {
			penguin.send('jmm', penguin.room.internal_id, penguin.name());
		}
	});

	WaddleEvent.on('LeaveMatchMaking-951', (penguin) => {
		let player;
		let waddleId = penguin.room.internal_id;
		let externalId = penguin.room.external_id;
		let _index = matchQueue.indexOf(penguin);

		if(_index == -1) {
			return logger.log(penguin.name() + ' is trying to leave but isn\'t in queue.', 'red');
		}

		if(matchQueue.length == 2) {
			if(_index == 0) {
				player = secondPlayer;
			} else {
				player = firstPlayer;
			}

			player.send('tmm', player.room.internal_id, -1, player.name());
		}

		matchQueue.splice(_index, 1);

		waddlePlayers[externalId][waddleId][_index] = '';
		waddlesById[externalId][waddleId][_index] = '';

		penguin.inWaddle = false;

		penguin.send('lmm', penguin.room.internal_id);
	});

	WaddleEvent.on('JoinSensei-951', (penguin) => {
		penguin.send('jsen', penguin.room.internal_id);

		let externalId = penguin.id + 951;

		penguin.inWaddle = true;
		penguin.waddleId = senseiWaddleId;
		penguin.waddleRoom = externalId;
		penguin.waddleRoomId = externalId;
		penguin.playerSeat = 1;
		penguin.senseiBattle = true;

		penguin.send('scard', penguin.room.internal_id, 998, externalId, 1);
		penguin.send('sw', penguin.room.internal_id, 998, externalId, 1);

		waddlePlayerStrings[externalId] = {};
		waddleConnections[externalId] = {};
		roomByWaddle[externalId] = {};

		waddlePlayerStrings[externalId][senseiWaddleId] = [];
		waddleConnections[externalId][senseiWaddleId] = [true, true];
		roomByWaddle[externalId][senseiWaddleId] = 998;
		waddleRooms[externalId] = new room(998, externalId, 1, false, false);
		gameByWaddle[externalId] = new SenseiMatch([penguin]);
	});
}