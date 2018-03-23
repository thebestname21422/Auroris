var logger = require('../../../../util/logger.js');
var network = require('../../../../util/network.js');
var Promise = require("bluebird");
var _ = require('underscore')._;

var range = require("range").range;

class CardJitsuFireMatch {
	constructor(penguinInstances, externalId) {
		this.players = penguinInstances;
		this.playerAmount = this.players.length;

		[this.firstPlayer, this.secondPlayer, this.thirdPlayer, this.fourthPlayer] = this.players;

		this.energyLevels = [6, 6, 6, 6];
		this.scores = [0, 0, 0, 0];

		this.boardObject = [
			['cj', false, ''], 
			['w', false, ''], 
			['f', false, ''], 
			['s', false, ''], 
			['elem', false, ''], 
			['cj', false, ''], 
			['f', false, ''], 
			['w', false, ''], 
			['s', false, ''], 
			['cj', false, ''], 
			['f', false, ''], 
			['s', false, ''], 
			['w', false, ''], 
			['cj', false, ''], 
			['f', false, ''], 
			['w', false, ''], 
			['s', false, '']
		];

		this.boardSpaces = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

		this.playerBoard = [1, 5, 7, 8];

		this.board = [10, 5, 5];

		this.MAX_TABS = 16;

		this.currentTurn = null;

		this.externalId = externalId;

		this.completed = false;
	}

	initMatch() {
		let versus = '(' + this.players.map((p) => p.name()).join(' VS ') + ')';
		
		logger.log('Initiating CJ Fire Match ' + versus, 'green');

		for(var index in this.playerBoard) {
			let boardSpacesArray = this.boardSpaces.filter((s) => isNaN(s) == false);
			let randomPosition = boardSpacesArray[Math.floor(Math.random() * boardSpacesArray.length)];

			for(var _ind in this.boardSpaces) {
				if(this.boardSpaces[_ind] == randomPosition) {
					this.boardSpaces[_ind] = index;
				}
			}

			this.playerBoard[index] = randomPosition;
		}
	}

	async dealCards(cardArray, amount) {
		return new Promise(function (resolve, reject) {
			var cardDetails = [];

			Promise.map(range(amount), (function(cardIndex) {
				cardDetails.push(cardArray[Math.floor(Math.random() * cardArray.length)].split('|')[1]);
			}).bind(this)).then(() => {
				resolve(cardDetails.join(','));
			});
		});
	}

	async startGameMessage(penguin) {
		let message = 'sz';
		let startSeat = Math.floor(Math.random() * this.playerAmount) + 0;
		let nicknames = this.players.map((p) => p.name()).join(',');
		let colours = this.players.map((p) => p.colour).join(',');
		let energyLevels = this.energyLevels.slice(this.playerAmount).join(',');
		let boardPositions = this.buildBoardPositionsString();
		let cardList = 'undefined';
		let boardOptions = this.board.join(',');
		let ranks = this.players.map((p) => p.belt).join(',');
		let scores = this.scores.slice(this.playerAmount).join(',');
		let dataSend = [nicknames, colours, energyLevels, boardPositions, cardList, boardOptions, ranks, scores];

		this.currentTurn = Number(startSeat);

		for(var index in this.players) {
			let player = this.players[index];

			dataSend[4] = await this.dealCards(player.cards, 5);

			player.send(message, player.room.internal_id, startSeat, dataSend.join('%'));
		}
	}

	isMyTurn(seatIndex) {
		if(this.currentTurn == null) return false;

		if(Number(seatIndex) == Number(this.currentTurn)) {
			return true;
		}

		return false;
	}

	buildBoardPositionsString() {
		let boardString = '';

		switch(this.playerAmount) {
			case 2:
				boardString = [this.playerBoard[this.firstPlayer.playerSeat], this.playerBoard[this.secondPlayer.playerSeat]].join(',');
				break;
			case 3:
				boardString = [this.playerBoard[this.firstPlayer.playerSeat], this.playerBoard[this.secondPlayer.playerSeat], this.playerBoard[this.thirdPlayer.playerSeat]].join(',');
				break;
			case 4:
				boardString = [this.playerBoard[this.firstPlayer.playerSeat], this.playerBoard[this.secondPlayer.playerSeat], this.playerBoard[this.thirdPlayer.playerSeat], this.playerBoard[this.fourthPlayer.playerSeat]].join(',');
				break;
		}

		return boardString;
	}

	sendMovementMessage(penguin, movementType, movementArgs) {
		console.log(movementType, movementArgs);

		let seatIndex;
		let tabId;

		switch(movementType) {
			case 'cb': //choose board
				tabId = Number(movementArgs[0]);

				//if(!this.isMyTurn(seatIndex)) return network.removePenguin(penguin);

				if(tabId > this.MAX_TABS) return network.removePenguin(penguin);

				//if(Number(seatIndex) !== Number(penguin.playerSeat)) return network.removePenguin(penguin);

				this.boardObject[tabId][1] = true;
				this.boardObject[tabId][2] = penguin.playerSeat;

				this.playerBoard[penguin.playerSeat] = tabId;

				penguin.room.send(penguin, 'zm', penguin.room.internal_id, 'cb', movementArgs.join('%'));
				penguin.room.send(penguin, 'zm', penguin.room.internal_id, 'ub', penguin.playerSeat, this.buildBoardPositionsString());
				break;
			case 'is': //info spinner click
				seatIndex = Number(movementArgs[0]);
				tabId = Number(movementArgs[1]);

				if(!this.isMyTurn(seatIndex)) return network.removePenguin(penguin);

				if(tabId > this.MAX_TABS) return network.removePenguin(penguin);

				if(Number(seatIndex) !== Number(penguin.playerSeat)) return network.removePenguin(penguin);

				penguin.room.send(penguin, 'zm', penguin.room.internal_id, 'is', movementArgs.join('%'));
				break;
		}
	}
}

module.exports = CardJitsuFireMatch;