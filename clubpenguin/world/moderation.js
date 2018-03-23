var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var fs = require('fs');

/* Moderation - o# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.kickPlayerById = function(penguin, data) {
		if(penguin.moderator) {
			var playerId = data[0];
			
			if(!isNaN(playerId)) {
				if(penguinsById[playerId] !== undefined) {
					kickPlayer(penguinsById[playerId]);
				} else {
					penguin.send('mm', penguin.room.internal_id, 'Player is offline or on another server.', -1);
				}
			}
		}
	}
	
	this.banPlayer = function(penguin, message) {
		var timestamp = new Date();
		
		timestamp.setHours(timestamp.getHours() + 24);
		
		timestamp = timestamp.getTime() / 1000;
		
		penguin.database.update_column(penguin.id, 'Banned', timestamp);
		penguin.send('e', penguin.room.internal_id, 610, message);
		
		return network.removePenguin(penguin);
	}
	
	this.kickPlayer = function(penguin) {
		penguin.send('e', penguin.room.internal_id, 5);
		
		return network.removePenguin(penguin);
	}

	this.mutePlayerById = function(penguin, data) {
		if(penguin.moderator) {
			var playerId = data[0];

			if(!isNaN(playerId)) {
				if(penguinsById[playerId] !== undefined) {
					if(penguinsById[playerId].muted) {
						penguinsById[playerId].muted = false;
					} else {
						penguinsById[playerId].muted = true;
					}
				} else {
					penguin.send('mm', penguin.room.internal_id, 'Player is offline or on another server.', -1);
				}
			}
		}
	}
}