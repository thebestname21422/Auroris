var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* User - u# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.sendHeartbeat = function(penguin, data) {
		penguin.send('h', penguin.room.internal_id);
	}

	this.sendLastRevision = function(penguin, data) {
		penguin.send('glr', -1, 'Auroris');
	}

	this.sendEmote = function(penguin, data) {
		var emote_id = data[0];

		if(isNaN(emote_id)) {
			return network.removePenguin(penguin);
		}

		penguin.room.send(penguin, 'se', penguin.room.internal_id, penguin.id, emote_id);
	}
	
	this.sendSafeChat = function(penguin, data) {
		var id = data[0];
		
		if(isNaN(id)) {
			return network.removePenguin(penguin);
		}
		
		penguin.room.send(penguin, 'ss', penguin.room.internal_id, penguin.id, id);
	}

	this.sendLine = function(penguin, data) {
		var id = data[0];
		
		if(isNaN(id)) {
			return network.removePenguin(penguin);
		}
		
		penguin.room.send(penguin, 'sl', penguin.room.internal_id, penguin.id, id);
	}

	this.sendJoke = function(penguin, data) {
		var id = data[0];
		
		if(isNaN(id)) {
			return network.removePenguin(penguin);
		}
		
		penguin.room.send(penguin, 'sj', penguin.room.internal_id, penguin.id, id);
	}
	
	this.sendTourMessage = function(penguin, data) {
		var id = data[0];
		
		if(isNaN(id)) {
			return network.removePenguin(penguin);
		}
		
		penguin.room.send(penguin, 'sg', penguin.room.internal_id, penguin.id, id);
	}

	this.sendPosition = function(penguin, data) {
		var x = data[0];
		var y = data[1];

		if(isNaN(x) || isNaN(y)) {
			return network.removePenguin(penguin);
		}

		penguin.x = Number(x);
		penguin.y = Number(y);
		
		penguin.cdu = 0;

		penguin.room.send(penguin, 'sp', penguin.room.internal_id, penguin.id, penguin.x, penguin.y);
    }
	
	this.sendTeleport = function(penguin, data) {
		var x = data[0];
		var y = data[1];

		if(isNaN(x) || isNaN(y)) {
			return network.removePenguin(penguin);
		}

		penguin.x = Number(x);
		penguin.y = Number(y);

		penguin.room.send(penguin, 'tp', penguin.room.internal_id, penguin.id, penguin.x, penguin.y);
    }

	this.sendSnowball = function(penguin, data) {
		var x = data[0];
		var y = data[1];

		if(isNaN(x) || isNaN(y)) {
			return network.removePenguin(penguin);
		}

		penguin.room.send(penguin, 'sb', penguin.room.internal_id, penguin.id, x, y);
    }
	
	this.sendFrame = function(penguin, data) {
		var frame = data[0];
		
		if(isNaN(frame)) {
			return network.removePenguin(penguin);
		}
		
		penguin.frame = Number(frame);

		penguin.room.send(penguin, 'sf', penguin.room.internal_id, penguin.id, penguin.frame);
	}
	
	this.sendAction = function(penguin, data) {
		var actionId = data[0];
		
		if(isNaN(actionId)) {
			return network.removePenguin(penguin);
		}
		
		penguin.room.send(penguin, 'sa', penguin.room.internal_id, penguin.id, actionId);
	}
	
	this.getPlayer = function(penguin, data) {
		var playerId = data[0];
		
		if(isNaN(playerId)) {
			return;
		}
		
		if(penguin.buddiesById[playerId] == undefined) {
			return;
		}
		
		penguin.database.playerIdExists(playerId, function(result) {
			if(!result) {
				return;
			}
			
			var playerDetails = [];
			
			penguin.database.get_columns(playerId, ['ID', 'Nickname', 'Color', 'Head', 'Face', 'Neck', 'Body', 'Hand', 'Feet', 'Flag', 'Photo', 'approved'], function(result) {
				var playerName = result['Nickname'];
				
				if(Number(result['approved']) == 0) {
					playerName = 'P' + result['ID'];
				}
				
				playerDetails.push(
					result['ID'],
					playerName,
					45,
					result['Color'],
					result['Head'],
					result['Face'],
					result['Neck'],
					result['Body'],
					result['Hand'],
					result['Feet'],
					result['Flag'],
					result['Photo'],
					146
				);
				
				penguin.send('gp', penguin.room.internal_id, playerDetails.join('|'));
			});
		});
	}
	
	this.coinsDigUpdate = function(penguin, data) {
		if(penguin.room.external_id !== 813 || penguin.frame !== 26 || penguin.cdu > 5) {
			return;
		}
		
		var coinsEarned = Math.floor(Math.random() * (30 - 10) + 10);
		
		penguin.addCoins(coinsEarned);
		penguin.cdu++;
		
		penguin.send('cdu', penguin.room.internal_id, coinsEarned, penguin.coins);
	}

	return this;
}