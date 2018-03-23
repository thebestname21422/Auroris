var logger = require('../../../../util/logger.js');
var network = require('../../../../util/network.js');
var Promise = require("bluebird");
var _ = require('underscore')._;

var range = require("range").range;

require('../../mail.js')();

class CardJitsuMatch {
	constructor(penguinInstances, isSenseiMatch = false) {
		this.firstPlayer = penguinInstances[0];
		this.secondPlayer = penguinInstances[1];
		
		this.isSenseiMatch = isSenseiMatch;
		
		this.completed = false;

		this.pickedCards = ['', ''];

		this.firstPlayerElements = {
			's': {
				'r': '',
				'b': '',
				'y': '',
				'g': '',
				'o': '',
				'p': ''
			},
			'w': {
				'r': '',
				'b': '',
				'y': '',
				'g': '',
				'o': '',
				'p': ''
			},
			'f': {
				'r': '',
				'b': '',
				'y': '',
				'g': '',
				'o': '',
				'p': ''
			}
		}

		this.secondPlayerElements = {
			's': {
				'r': '',
				'b': '',
				'y': '',
				'g': '',
				'o': '',
				'p': ''
			},
			'w': {
				'r': '',
				'b': '',
				'y': '',
				'g': '',
				'o': '',
				'p': ''
			},
			'f': {
				'r': '',
				'b': '',
				'y': '',
				'g': '',
				'o': '',
				'p': ''
			}
		}

		this.addedPercentage = {
			0: 100, //no belt
			1: 20, //white
			2: 15, //yellow
			3: 11, //orange
			4: 10, //green
			5: 13, //blue
			6: 9, //red
			7: 8, //purple
			8: 5 //brown
		}

		this.loserAddedPercentage = {
			0: 30, //no belt
			1: 9, //white
			2: 5, //yellow
			3: 5, //orange
			4: 7, //green
			5: 7, //blue
			6: 3, //red
			7: 3, //purple
			8: 3 //brown
		}

		this.beltItemIds = ['0', '4025', '4026', '4027', '4028', '4029', '4030', '4031', '4032', '4033'];

		this.dealingCards = {};
		this.dealingCards[this.firstPlayer.id] = this.firstPlayer.cards.slice(0, this.firstPlayer.cards.length);
		this.dealingCards[this.secondPlayer.id] = this.secondPlayer.cards.slice(0, this.secondPlayer.cards.length);
		
		this.dealtCards = {};
		this.dealtCards[this.firstPlayer.id] = [];
		this.dealtCards[this.secondPlayer.id] = [];

		this.dealtCardsObj = {};
		this.dealtCardsObj[this.firstPlayer.id] = {};
		this.dealtCardsObj[this.secondPlayer.id] = {};

		this.cardByIndex = {};
		this.cardByIndex[this.firstPlayer.id] = {};
		this.cardByIndex[this.secondPlayer.id] = {};

		this.lastCard = {};
		this.lastCard[this.firstPlayer.id] = 0;
		this.lastCard[this.secondPlayer.id] = 0;

		this.cardIndexById = {};
		this.cardIndexById[this.firstPlayer.id] = {};
		this.cardIndexById[this.secondPlayer.id] = {};

		this.playerScore = {};
		this.playerScore[this.firstPlayer.id] = 0;
		this.playerScore[this.secondPlayer.id] = 0;

		this.wonRounds = [false, false];
	}
	
	initMatch() {
		var versus = '(' + this.firstPlayer.name() + ' VS ' + this.secondPlayer.name() + ')';
		
		logger.log('Initiating CJ Match ' + versus, 'green');
	}
	
	selectRandomCard(fullCards, cards) {
		let returnCard = cards[Math.floor(Math.random() * cards.length)];

		return returnCard.split('|');
	}
	
	dealCards(penguin, dealType) {
		var cardDetails = [];
		
		Promise.map(range(dealType), (function(cardIndex) {
			if(this.dealingCards[penguin.id].length < 1) {
				this.dealingCards[penguin.id] = penguin.cards.slice(0, penguin.cards.length); //reset deck cards
			}

			var card = this.selectRandomCard(penguin.cards, this.dealingCards[penguin.id]);
			var cardString = card.join('|');
			var cardId = card[1];
			var _index = this.dealingCards[penguin.id].indexOf(cardString);

			if(_index !== -1) {
				this.dealingCards[penguin.id].splice(_index, 1); //remove from deck
			}

			if(Number(dealType) == 1) {
				cardIndex = this.lastCard[penguin.id];
			}

			card[0] = cardIndex;
			
			cardDetails.push(card.join('|'));

			this.dealtCards[penguin.id].push(Number(cardIndex));
			this.dealtCardsObj[penguin.id][cardIndex] = card;
			this.cardByIndex[penguin.id][cardIndex] = card;
			this.cardIndexById[penguin.id][cardId] = cardIndex;
			this.lastCard[penguin.id]++;
		}).bind(this)).then(() => {
			penguin.room.send(penguin, 'zm', penguin.waddleRoom, 'deal', penguin.playerSeat, cardDetails.join('%'));
		});
	}
	
	pickCard(penguin, cardIndex) {
		if(isNaN(cardIndex)) {
			return network.removePenguin(penguin);
		}

		if(this.dealtCards[penguin.id].indexOf(Number(cardIndex)) == -1) {
			return network.removePenguin(penguin);
		}

		this.pickedCards[penguin.playerSeat] = this.cardByIndex[penguin.id][cardIndex][1];

		penguin.room.send(penguin, 'zm', penguin.waddleRoom, 'pick', penguin.playerSeat, cardIndex);
		
		if(this.pickedCards.indexOf('') == -1) { //both players picked cards
			let playerWins;
			let cardPicked;
			let cardPickedArr;
			let _cardIndex;
			let winner = this.determineWinner(); //winner winner chicken dinner
			let penguinWinner;
			let penguinLoser;

			penguin.room.send(penguin, 'zm', penguin.waddleRoom, 'judge', winner);

			if(winner !== -1) {
				switch(winner) {
					case 0:
						//player 1
						penguinWinner = this.firstPlayer;
						penguinLoser = this.secondPlayer;
						playerWins = this.firstPlayerElements;
						_cardIndex = this.pickedCards[0];
						cardPicked = this.firstPlayer.cardsById[_cardIndex];
						cardPickedArr = cardPicked.split('|');
						cardPickedArr[0] = cardIndex;
						break;
					case 1:
						//player 2
						penguinWinner = this.secondPlayer;
						penguinLoser = this.firstPlayer;
						playerWins = this.secondPlayerElements;
						_cardIndex = this.pickedCards[1];
						cardPicked = this.secondPlayer.cardsById[_cardIndex];
						cardPickedArr = cardPicked.split('|');
						cardPickedArr[0] = cardIndex;
						break;
				}

				let cardElement = cardPickedArr[2];
				let cardColour = cardPickedArr[4];
				let cardPowerId = cardPickedArr[5];

				playerWins[cardElement][cardColour] = this.cardIndexById[penguinWinner.id][cardPickedArr[1]];

				this.playerScore[penguinWinner.id]++;

				this.wonRounds[penguinWinner.playerSeat] = true;

				/*if(Number(cardPowerId) !== 0) {
					penguin.room.send(penguin, 'zm', penguin.waddleRoom, 'power', penguinWinner.playerSeat, penguinLoser.playerSeat, cardPowerId);
				}*/

				this.hasPlayerWon(penguinWinner, playerWins, (function(response) {
					let bool = response[0];
					let cardStr = response[1];

					if(bool && !this.completed) {
						this.completed = true;

						penguin.room.send(penguin, 'czo', penguin.waddleRoom, 0, winner, cardStr);

						if(this.wonRounds[penguinLoser.playerSeat] == false) {
							penguinWinner.addStamp(238);
						}

						penguinWinner.jitsuMatchesWon++;

						if(penguinWinner.jitsuMatchesWon == 25) {
							penguinWinner.addStamp(240); //win 25 matches
						}

						if(this.playerScore[penguinWinner.id] >= 9) {
							penguinWinner.addStamp(248);
						}

						//update percentage
						let newBelts = this.updateNinjaJourney(penguinWinner, penguinLoser);

						if(newBelts[0]) {
							penguinWinner.send('cza', penguinWinner.waddleRoom, penguinWinner.belt);
						}

						if(newBelts[1]) {
							penguinLoser.send('cza', penguinLoser.waddleRoom, penguinLoser.belt);
						}
					}
				}).bind(this));
			}

			this.pickedCards[0] = '';
			this.pickedCards[1] = '';
		}
	}

	updateNinjaJourney(penguinWinner, penguinLoser) {
		let newWinnerPercentageArray = this.getNewNinjaPercentage(penguinWinner, 'winner');
		let newLoserPercentageArray = this.getNewNinjaPercentage(penguinLoser, 'loser');

		penguinWinner.database.update_column(penguinWinner.id, 'NinjaPercentage', newWinnerPercentageArray[1]);
		penguinLoser.database.update_column(penguinLoser.id, 'NinjaPercentage', newLoserPercentageArray[1]);

		penguinWinner.ninja = newWinnerPercentageArray[1];
		penguinLoser.ninja = newLoserPercentageArray[1];

		if(newWinnerPercentageArray[0] == true) {
			this.addNinjaRewards(penguinWinner);
		}

		if(newLoserPercentageArray[0] == true) {
			this.addNinjaRewards(penguinLoser);
		}

		return [newWinnerPercentageArray[0], newLoserPercentageArray[0]];
	}

	addNinjaRewards(penguin) {
		penguin.belt++;

		penguin.addItem(String(this.beltItemIds[penguin.belt]), 0, false);
		penguin.database.update_column(penguin.id, 'NinjaBelt', penguin.belt);

		switch(penguin.belt) {
			case 1:
				sendSystemMail(penguin, penguin.id, '', 177);
				penguin.addStamp(230);
				break;

			case 5:
				sendSystemMail(penguin, penguin.id, '', 178);
				penguin.addStamp(232);
				break;

			case 9:
				sendSystemMail(penguin, penguin.id, '', 179);
				penguin.addStamp(234); //true ninja
				break;
		}
	}

	getNewNinjaPercentage(penguin, type) {
		let percentageAdd;

		if(penguin.belt > 9) { //no more belts after black
			return [false, 0];
		}

		if(type == 'winner') {
			percentageAdd = this.addedPercentage[penguin.belt];
		} else {
			percentageAdd = this.loserAddedPercentage[penguin.belt];
		}

		let newPercentage = penguin.ninja + percentageAdd;

		if(newPercentage >= 100) {
			newPercentage -= 100;

			return [true, newPercentage];
		}

		return [false, newPercentage];
	}

	hasPlayerWon(penguin, playerWins, callback) {
		let waterCol;
		let fireCol;
		let snowCol;

		if(playerWins == undefined) {
			return false;
		}

		this.findElementStackWin(playerWins, function(response) {
			let elementKey = response[0];
			let bool = response[1];
			let elementColours = response[2];
			let cardStr = [];

			if(bool !== false) {
				penguin.addStamp(244); //one element

				Promise.each(elementColours, (colour) => cardStr.push(playerWins[elementKey][colour]))
				       .then(() => callback([true, cardStr.join('%')])); //win card string indexes

				return;
			}
		});

		this.findAllElementWin(playerWins, function(response) {
			let elementKey = response[0];
			let bool = response[1];
			let cardIndexes = response[2];

			if(bool !== false) {
				penguin.addStamp(242); //elemental win
				return callback([true, cardIndexes.join('%')]); //win card string indexes
			}
		});
	}

	findElementStackWin(playerWins, callback) {
		let elementColours = {};

		elementColours['s'] = [];
		elementColours['f'] = [];
		elementColours['w'] = [];

		Promise.each(Object.keys(playerWins), (elementKey) => {
			let elementObject = playerWins[elementKey];

			Promise.each(Object.keys(elementObject), (colourKey) => {
				let colourString = elementObject[colourKey];

				if(colourString !== '') {
					elementColours[elementKey].push(colourKey);
				}
			}).then(() => {
				if(elementColours[elementKey].length >= 3) {
					return callback([elementKey, true, elementColours[elementKey]]);
				}
			});
		});
	}

	findAllElementWin(playerWins, callback) {
		let tempPlayerWins = playerWins;
		let coloursUsed = {};
		let elementsLooped = [];
		let elementsAdded = {};
		let elementColours = {};

		elementColours['s'] = [];
		elementColours['f'] = [];
		elementColours['w'] = [];

		coloursUsed['s'] = [];
		coloursUsed['f'] = [];
		coloursUsed['w'] = [];

		elementsAdded['s'] = 0;
		elementsAdded['f'] = 0;
		elementsAdded['w'] = 0;

		Promise.each(Object.keys(tempPlayerWins), (elementKey) => {
			//s, w, f
			let elementObject = tempPlayerWins[elementKey];

			elementsLooped.push(elementKey);

			Promise.each(Object.keys(elementObject), (colourKey) => {
				if(elementObject[colourKey] !== '') {
					elementColours[elementKey].push(colourKey);
				}
			}).then(() => {
				if(elementsLooped.length == 3) {
					for(var index in elementColours['s']) {
						var cols = elementColours['s'][index];

						for(var _index in elementColours['w']) {
							var _cols = elementColours['w'][_index];

							for(var __index in elementColours['f']) {
								var __cols = elementColours['f'][__index];

								if(cols !== _cols && __cols !== cols && _cols !== __cols) {
									let finalArr = [playerWins['s'][cols], playerWins['w'][_cols], playerWins['f'][__cols]];
									return callback([elementKey, true, finalArr]);
								}
							}
						}
					}
				}
			});
		});
	}

	determineWinner() {
		const card1 = this.pickedCards[0];
		const card2 = this.pickedCards[1];
		
		if(this.firstPlayer.ownedCards.indexOf(Number(card1)) == -1 
				|| this.secondPlayer.ownedCards.indexOf(Number(card2)) == -1) { //
			return -1;
		}
		
		let cardString1 = this.firstPlayer.cardsById[card1];
		let cardString2 = this.secondPlayer.cardsById[card2];
		
		let cardElement1 = cardString1.split('|')[2];
		let cardElement2 = cardString2.split('|')[2];
		
		let cardValue1 = Number(cardString1.split('|')[3]);
		let cardValue2 = Number(cardString2.split('|')[3]);
		
		let elementResult = this.checkElements(cardElement1, cardElement2);
		
		if(elementResult !== -1) {
			return elementResult;
		}
		
		return this.checkValues(cardValue1, cardValue2);
	}

	checkValues(cardValue1, cardValue2) {
		if(cardValue1 > cardValue2) {
			return 0;
		} else if(cardValue2 > cardValue1) {
			return 1;
		} else {
			return -1;
		}
	}

	checkElements(cardElement1, cardElement2) {
		if(cardElement1 == cardElement2) {
			return -1;
		}
		
		switch(cardElement1) {
			case 'w':
				if(cardElement2 == 'f') {
					return 0;
				}
				break;
			case 'f':
				if(cardElement2 == 's') {
					return 0;
				}
				break;
			case 's':
				if(cardElement2 == 'w') {
					return 0;
				}
				break;
		}
		
		switch(cardElement2) {
			case 'w':
				if(cardElement1 == 'f') {
					return 1;
				}
				break;
			case 'f':
				if(cardElement1 == 's') {
					return 1;
				}
				break;
			case 's':
				if(cardElement1 == 'w') {
					return 1;
				}
				break;
		}
	}
}

module.exports = CardJitsuMatch;