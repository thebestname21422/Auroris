var logger = require('../../../../util/logger.js');
var network = require('../../../../util/network.js');
var Promise = require("bluebird");
var _ = require('underscore')._;

var range = require("range").range;

require('../../mail.js')();

class SenseiMatch {
	constructor(penguinInstances) {
		this.firstPlayer = penguinInstances[0];
		
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

		this.senseiCardsById = global.cardsById;

		this.dealingCards = {};
		this.dealingCards[this.firstPlayer.id] = this.firstPlayer.cards.slice(0, this.firstPlayer.cards.length);
		//this.dealingCards['sensei'] = this.secondPlayer.cards.slice(0, this.secondPlayer.cards.length);
		
		this.dealtCards = {};
		this.dealtCards[this.firstPlayer.id] = [];
		this.dealtCards['sensei'] = [];

		this.dealtCardsObj = {};
		this.dealtCardsObj[this.firstPlayer.id] = {};
		this.dealtCardsObj['sensei'] = {};

		this.cardByIndex = {};
		this.cardByIndex[this.firstPlayer.id] = {};
		this.cardByIndex['sensei'] = {};

		this.lastCard = {};
		this.lastCard[this.firstPlayer.id] = 0;
		this.lastCard['sensei'] = 10;

		this.cardIndexById = {};
		this.cardIndexById[this.firstPlayer.id] = {};
		this.cardIndexById['sensei'] = {};

		this.defeatCard = {}; //sensei's cards to defeat player
	}
	
	initMatch() {
		var versus = '(' + this.firstPlayer.name() + ' VS Sensei)';
		
		logger.log('Initiating CJ Match ' + versus, 'green');
	}
	
	selectRandomCard(cards) {
		let returnCard = cards[Math.floor(Math.random() * cards.length)];

		return returnCard.split('|');
	}

	dealSenseiCheatCards(penguin, dealType) {
		var cardDetails = [];
		var cardIndex = 0;

		//check player's deck

		Promise.each(Object.keys(this.dealtCardsObj[penguin.id]), (function(deckCardIndex) {
			cardIndex++;

			if(Number(dealType) == 1) {
				cardIndex = this.lastCard['sensei'];
			}

			let cardArray;
			let deckCard = this.dealtCardsObj[penguin.id][deckCardIndex].join('|');
			let _cardDetails = deckCard.split('|'); //player's card
			let cardElement = _cardDetails[2];
			let cardPower = _cardDetails[3];
			let cardColour = _cardDetails[4];
			let fireCards = global.cardsObject.filter((c) => c.element === 'f');
			let waterCards = global.cardsObject.filter((c) => c.element === 'w');
			let snowCards = global.cardsObject.filter((c) => c.element === 's');

			switch(cardElement) {
				case 'f':
					cardArray = waterCards;
					break;

				case 'w':
					cardArray = snowCards;
					break;

				case 's':
					cardArray = fireCards;
					break;
			}

			cardArray = cardArray.map((c) => c.details);

			let senCard = this.selectRandomCard(cardArray);

			senCard[0] = cardIndex;

			this.defeatCard[_cardDetails[0]] = senCard;

			cardDetails.push(senCard.join('|'));

			console.log('senCard', senCard.join('|'));
			console.log('senIndex', cardIndex);

			this.dealtCards['sensei'].push(Number(cardIndex));
			this.dealtCardsObj['sensei'][cardIndex] = senCard;
			this.cardByIndex['sensei'][cardIndex] = senCard;
			this.cardIndexById['sensei'][senCard[1]] = cardIndex;
			this.lastCard['sensei']++;
		}).bind(this)).then(() => {
			penguin.send('zm', penguin.waddleRoom, 'deal', 0, cardDetails.join('%'));
		});
	}

	dealSenseiRandomCards(penguin, dealType) {
		var cardDetails = [];

		this.dealtCards['sensei'] = [];
		
		Promise.map(range(dealType), (function(cardIndex) {
			var card = this.selectRandomCard(global.cardsArray);
			var cardString = card.join('|');
			var cardId = card[1];

			if(Number(dealType) == 1) {
				cardIndex = this.lastCard['sensei'];
			}

			card[0] = cardIndex;
			
			cardDetails.push(card.join('|'));

			this.dealtCards['sensei'].push(Number(cardIndex));
			this.dealtCardsObj['sensei'][cardIndex] = card;
			this.cardByIndex['sensei'][cardIndex] = card;
			this.cardIndexById['sensei'][cardId] = cardIndex;
			this.lastCard['sensei']++;
		}).bind(this)).then(() => {
			penguin.send('zm', penguin.waddleRoom, 'deal', 0, cardDetails.join('%'));
		});
	}
	
	dealCards(penguin, dealType) {
		var cardDetails = [];

		this.dealtCardsObj[penguin.id] = {}; //reset every round for sensei
		
		Promise.map(range(dealType), (function(cardIndex) {
			if(this.dealingCards[penguin.id].length < 1) {
				this.dealingCards[penguin.id] = penguin.cards.slice(0, penguin.cards.length); //reset deck cards
			}

			var card = this.selectRandomCard(this.dealingCards[penguin.id]);
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
			penguin.room.send(penguin, 'zm', penguin.waddleRoom, 'deal', 1, cardDetails.join('%'));

			if(penguin.belt < 9) {
				this.dealSenseiCheatCards(penguin, dealType);
			} else {
				this.dealSenseiRandomCards(penguin, dealType);
			}
		});
	}
	
	pickCard(penguin, cardIndex) {
		let senseiCard;

		if(isNaN(cardIndex)) {
			return network.removePenguin(penguin);
		}

		if(this.dealtCards[penguin.id].indexOf(Number(cardIndex)) == -1) {
			return network.removePenguin(penguin);
		}

		this.pickedCards[1] = this.cardByIndex[penguin.id][cardIndex][1];

		if(penguin.belt < 9) {
			senseiCard = this.defeatCard[cardIndex];
		} else {
			let senCardIndex = this.dealtCards['sensei'][Math.floor(Math.random() * this.dealtCards['sensei'].length)];

			senseiCard = this.cardByIndex['sensei'][senCardIndex];
		}

		this.pickedCards[0] = senseiCard[1];

		penguin.send('zm', penguin.waddleRoom, 'pick', 1, cardIndex);
		penguin.send('zm', penguin.waddleRoom, 'pick', 0, senseiCard[0]);
		
		if(this.pickedCards.indexOf('') == -1) { //both players picked cards
			let playerWins;
			let cardPicked;
			let cardPickedArr;
			let _cardIndex;
			let winner = this.determineWinner(); //winner winner chicken dinner
			let penguinWinner;
			let penguinLoser;

			penguin.send('zm', penguin.waddleRoom, 'judge', winner);

			if(winner !== -1) {
				switch(winner) {
					case 0:
						//sensei
						penguinWinner = 'Sensei';
						penguinLoser = this.firstPlayer;
						playerWins = this.secondPlayerElements;
						_cardIndex = this.pickedCards[0];
						console.log('_cardIndex', _cardIndex);
						cardPicked = this.senseiCardsById[String(_cardIndex)];
						console.log('sennnnnn card', cardPicked);
						cardPickedArr = cardPicked.split('|');
						cardPickedArr[0] = cardIndex;
						break;

					case 1:
						//player 1
						penguinWinner = this.firstPlayer;
						penguinLoser = 'Sensei';
						playerWins = this.firstPlayerElements;
						_cardIndex = this.pickedCards[1];
						cardPicked = this.firstPlayer.cardsById[_cardIndex];
						cardPickedArr = cardPicked.split('|');
						cardPickedArr[0] = cardIndex;
						break;
				}

				let cardElement = cardPickedArr[2];
				let cardColour = cardPickedArr[4];

				console.log('cardPickedArr', cardPickedArr);

				if(winner == 0) {
					playerWins[cardElement][cardColour] = this.cardIndexById['sensei'][cardPickedArr[1]];

					if(Number(cardPickedArr[1]) == 256) {
						penguin.addStamp(246); //sensei card stamp
					}
				} else {
					playerWins[cardElement][cardColour] = this.cardIndexById[penguinWinner.id][cardPickedArr[1]];
				}

				this.hasPlayerWon(playerWins, (function(response) {
					let bool = response[0];
					let cardStr = response[1];

					if(bool && !this.completed) {
						this.completed = true;

						if(penguin.belt < 9 && winner == 1) {
							penguin.room.send(penguin, 'czo', penguin.waddleRoom, 0, 0, 0); //can't win sensei without black belt
						} else {
							penguin.room.send(penguin, 'czo', penguin.waddleRoom, 0, winner, cardStr);

							if(winner == 1 && penguin.inventory.indexOf('104') == -1) {
								//reward ninja mask

								penguin.addStamp(236); //Ninja Master

								penguin.belt = 10;
								penguin.ninja = 100;
								penguin.database.update_column(penguin.id, 'NinjaBelt', penguin.belt);
								penguin.database.update_column(penguin.id, 'NinjaPercentage', penguin.ninja);

								penguin.addItem('104', 0, false);
								penguin.send('cza', penguin.waddleRoom, penguin.belt);
							}
						}
					}
				}).bind(this));
			}

			this.pickedCards[0] = '';
			this.pickedCards[1] = '';
		}
	}

	hasPlayerWon(playerWins, callback) {
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
		console.log('picked cardssss', this.pickedCards);
		const card1 = this.pickedCards[1]; //player 1
		const card2 = this.pickedCards[0]; //sensei
		
		if(this.firstPlayer.ownedCards.indexOf(Number(card1)) == -1) {
			console.log('own card error');
			return -1;
		}
		
		let cardString1 = this.firstPlayer.cardsById[card1];
		let cardString2 = global.cardsById[card2];

		console.log('cardString1', cardString1);
		
		let cardElement1 = cardString1.split('|')[2];
		let cardElement2 = cardString2.split('|')[2];
		
		let cardValue1 = Number(cardString1.split('|')[3]);
		let cardValue2 = Number(cardString2.split('|')[3]);
		
		let elementResult = this.checkElements(cardElement1, cardElement2);
		
		if(elementResult !== -1) {
			console.log('return elem result');
			return elementResult;
		}
		
		console.log('return value result');
		return this.checkValues(cardValue1, cardValue2);
	}

	checkValues(cardValue1, cardValue2) {
		console.log('vals:', cardValue1, cardValue2);
		
		if(cardValue1 > cardValue2) {
			return 1;
		} else if(cardValue2 > cardValue1) {
			return 0;
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
					return 1;
				}
				break;
			case 'f':
				if(cardElement2 == 's') {
					return 1;
				}
				break;
			case 's':
				if(cardElement2 == 'w') {
					return 1;
				}
				break;
		}
		
		switch(cardElement2) {
			case 'w':
				if(cardElement1 == 'f') {
					return 0;
				}
				break;
			case 'f':
				if(cardElement1 == 's') {
					return 0;
				}
				break;
			case 's':
				if(cardElement1 == 'w') {
					return 0;
				}
				break;
		}
	}
}

module.exports = SenseiMatch;