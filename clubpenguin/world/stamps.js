var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* Stamps - st# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.getStamps = function(penguin, data, callback) {
		var playerId = data[0];
		
		if(penguin.stamps == null || penguin.stamps == undefined || isNaN(playerId)) {
			if(typeof(callback) == 'function') {
				return callback();
			}
			
			return;
		}
		
		penguin.database.playerIdExists(playerId, function(result) {
			if(!result) {
				return network.removePenguin(penguin);
			}
			
			penguin.database.get_column(playerId, 'Stamps', function(stamps) {
				var stampString = stamps.split(',').join('|');
				
				penguin.send('gps', -1, playerId, stampString);
				
				if(typeof(callback) == 'function') {
					return callback();
				}
			});
		});
	}
	
	this.addStamp = function(penguin, data) {
		let stampId = data[0];
		let blacklist = [7, 8, 33, 32, 34, 36, 35, 31, 466, 448, 290, 358, 599, 600, 4678, 601];

		if(isNaN(stampId)) {
			return;
		}

		if(blacklist.indexOf(Number(stampId)) >= 0) return AACEvent.emit('BanOffense', penguin, 24, 'Stamp manipulation');
		
		let stamps = penguin.stamps;

		if(stamps.indexOf(stampId) == -1) {
			stamps.push(Number(stampId));
			penguin.recentStamps.push(Number(stampId));
			penguin.database.update_column(penguin.id, 'Stamps', stamps.join(','));
		}
	}
	
	this.getRecentStamps = function(penguin, data) {
		penguin.send('gmres', -1, penguin.recentStamps.join('|'));
	}
	
	this.getBookCover = function(penguin, data) {
		var playerId = data[0];
		
		if(isNaN(playerId)) {
			return;
		}
		
		penguin.database.get_column(playerId, 'StampBook', function(stampbook) {
			penguin.send('gsbcd', -1, stampbook);
		});
	}
	
	this.updateBookCover = function(penguin, data) {
		var coverItemDetails = data;
		
		if(isNaN(coverItemDetails[0]) || isNaN(coverItemDetails[1]) || isNaN(coverItemDetails[2]) || isNaN(coverItemDetails[3])) {
			return;
		}
		
		if(coverItemDetails.length < 4 || coverItemDetails.length > 10) {
			return;
		}
		
		var newCover = [coverItemDetails[0], coverItemDetails[1], coverItemDetails[2], coverItemDetails[3]];
		
		if(coverItemDetails.length > 4) {
			coverItemDetails.splice(0, 4);
			
			for(var index = 0; index < coverItemDetails.length; index++) {
				if(coverItemDetails[index] == undefined) {
					return;
				}
				
				var updateBook = true;
				var coverDetails = coverItemDetails[index].split('|');
				
				for(var _index in coverDetails) {
					if(isNaN(coverDetails[_index])) {
						updateBook = false; //attempted exploit :/
					}
				}
				
				var stampId = String(coverDetails[1]);
				
				if(penguin.stamps.indexOf(stampId) == -1 && global.pins[stampId] == undefined) {
					updateBook = false; //exploit
				}
				
				if(updateBook) {
					newCover.push(coverItemDetails[index]);
				}
			}
		}
		
		penguin.database.update_column(penguin.id, 'StampBook', newCover.join('%'));
		penguin.send('ssbcd', -1);
	}
}