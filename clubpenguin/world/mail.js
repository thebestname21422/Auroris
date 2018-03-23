var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var Promise = require("bluebird");

/* Mail - l# */
module.exports = function() {
	this.startDependency = function() {
	}

    this.startMail = function(penguin, data) {
		penguin.database.getUnreadPostcardCount(penguin.id, function(unreadPostcards) {
			penguin.database.getPostcardCount(penguin.id, function(readPostcards) {
				penguin.send('mst', -1, Number(unreadPostcards), Number(readPostcards));
			});
		});
    }

    this.getMail = function(penguin, data) {
		penguin.database.getPostcardsById(penguin.id, function(result) {
			let postcardArray = [];
			
			Promise.each(result, (postcard) => {
				let postcardDetails = [postcard['SenderName'], postcard['SenderID'], postcard['Type'], postcard['Details'], postcard['Date'], postcard['ID']];
				
				postcardArray.push(postcardDetails.join('|'));
			}).then(() => {
				penguin.send('mg', -1, postcardArray.reverse().join('%'));
			});
		});
    }
	
	this.mailChecked = function(penguin, data) {
		penguin.database.mailChecked(penguin.id);
		
		penguin.send('mc', penguin.room.internal_id);
	}
	
	this.sendMail = function(penguin, data) {
		var recipientId = data[0];
		var postcardType = data[1];
		
		if(isNaN(recipientId) || isNaN(postcardType)) {
			return;
		}
		
		penguin.database.playerIdExists(recipientId, function(result) {
			if(!result) {
				return;
			}
			
			if(penguin.coins < 20) {
				return penguin.send('ms', penguin.room.internal_id, penguin.coins, 2);
			}
			
			penguin.database.getPostcardCount(recipientId, function(readPostcards) {
				if(Number(readPostcards) > 99) {
					return penguin.send('ms', penguin.room.internal_id, penguin.coins, 0);
				}
				
				if(global.postcards.indexOf(Number(postcardType)) == -1) {
					return penguin.send('e', penguin.room.internal_id, 402);
				}
				
				penguin.subtractCoins(10);
				penguin.send('ms', penguin.room.internal_id, penguin.coins, 1);
				
				var sentDate = new Date().getTime();
				
				penguin.database.sendMail(recipientId, penguin.name(), penguin.id, '', sentDate, postcardType, function(postcardId) {
					if(penguinsById[recipientId] !== undefined) {
						penguinsById[recipientId].send('mr', penguin.room.internal_id, penguin.name(), penguin.id, postcardType, '', sentDate, postcardId);
					}
				});
			});
		});
	}
	
	this.sendSystemMail = function(penguin, playerId, details, postcardType, sentDate) {
		var nickname = 'sys';
		var id = 0;
		
		if(sentDate == undefined) {
			var sentDate = new Date().getTime();
		}
		
		penguin.database.sendMail(playerId, nickname, id, details, sentDate, postcardType, function(postcardId) {
			if(penguinsById[playerId] !== undefined) {
				penguinsById[playerId].send('mr', penguin.room.internal_id, nickname, id, postcardType, details, sentDate, postcardId);
			}
		});
	}
	
	this.deleteMailItem = function(penguin, data) {
		var postcardId = data[0];
		
		if(isNaN(postcardId)) {
			return;
		}
		
		penguin.database.playerOwnsPostcard(postcardId, penguin.id, function(result) {
			if(!result) {
				return;
			}
			
			penguin.database.deleteMail(postcardId);
		});
	}
	
	this.deleteMailItemFromPlayer = function(penguin, data) {
		var playerId = data[0];
		
		if(isNaN(playerId)) {
			return;
		}
		
		penguin.database.deleteMailFromPlayer(penguin.id, playerId);
		
		penguin.database.getPostcardCount(penguin.id, function(readPostcards) {
			penguin.send('mdp', penguin.room.internal_id, readPostcards);
		});
	}
}