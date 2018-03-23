let logger = require('../../util/logger.js');
let network = require('../../util/network.js');
let Promise = require("bluebird");
let threading = require('threads');

/* Ninja - ni# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.handleGetNinjaRank = async function(penguin, data) {
		let playerId = data[0];
		let playerExists = await penguin.database.engine.playerIdExists(playerId);

		if(!playerExists) return;

		let jitsuRank = await penguin.database.engine.getColumnById(playerId, 'NinjaBelt');

		penguin.send('gnr', penguin.room.internal_id, playerId, jitsuRank); //add ranks w/ fire & water
	}

	this.handleGetNinjaLevel = function(penguin, data) {
		penguin.send('gnl', penguin.room.internal_id, penguin.belt, penguin.ninja);
	}

	this.handleGetWaterLevel = function(penguin, data) {
		return network.removePenguin(penguin);
	}

	this.handleGetFireLevel = function(penguin, data) {
		return network.removePenguin(penguin);
	}

	this.handleGetCardData = async function(penguin, data) {
		/*let thread = threading.spawn(function([cards]) {
			return new Promise(resolve => {
				let uniqueCards = cards.filter((e, p) => cards.indexOf(e) == p);
			
				let cardDetails = uniqueCards.map(function(c) {
					let id = c.split('|')[1];
					let quantity = cards.filter(v => v == c).length;

					return [id, quantity].join(',');
				});

				resolve(cardDetails);
			});
		});

		thread.send([penguin.cards]);
		thread.on('message', c => penguin.send('gcd', penguin.room.internal_id, c.join('|')));*/
		let uniqueCards = await Promise.filter(penguin.cards, (e, p) => penguin.cards.indexOf(e) == p);
		
		let cardDetails = await Promise.map(uniqueCards, async function(c) {
			let id = c.split('|')[1];
			let quantity = await penguin.cards.filter(v => v == c).length;

			return [id, quantity].join(',');
		});

		penguin.send('gcd', penguin.room.internal_id, cardDetails.join('|'));
	}
}