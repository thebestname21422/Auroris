var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var Promise = require("bluebird");

/* Redemption - red# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.handleRedemptionJoinServer = function(penguin, data) {
		var player_id = data[0];
		var world_hash = data[1];
		var language = data[2];
		
		logger.log('[' + global.world_id + '] > ' + penguin.username + ' is trying to join!', 'green');

		if(Number(player_id) !== Number(penguin.id)) {
			return network.removePenguin(penguin);
		}

		if(language !== 'en') { //might need changing
			return network.removePenguin(penguin);
		}

		if(world_hash == '') {
			return network.removePenguin(penguin);
		}

		penguin.database.get_column(penguin.id, 'LoginKey', function(db_key) {
			if(db_key !== world_hash) {
				penguin.send('e', -1, 101);
				return network.removePenguin(penguin);
			}

			penguin.loadPenguin(function() {
				penguin.send('rjs', -1, 1, 0, 1);
			});
		});
	}
	
	this.handleRedemptionSendCode = function(penguin, data) {
		var unlockCode = data[0];
		
		logger.log(penguin.name() + ' is trying to unlock ' + unlockCode, 'green');
		
		penguin.database.unlockCodeExists(unlockCode, function(exists) {
			if(!exists) {
				return penguin.send('e', -1, 720);
			}
			
			penguin.database.getUnlockCodeByName(unlockCode, function(id, name, type, items, coins, expired, redeemed) {
				var redeemedArray = redeemed.split(',');
				var itemsArray = items.split(',');
				
				if(Number(expired) == 1) {
					return penguin.send('e', -1, 726);
				}
				
				if(redeemedArray.indexOf(String(penguin.id)) >= 0) {
					return penguin.send('e', -1, 721); //already redeemed!
				}				
				
				if(type == 'BLANKET') {
					penguin.database.updateUnlockCode(id, 'Expired', 1);
				}
				
				redeemedArray.push(String(penguin.id));
				
				if(Number(coins) > 0) {
					penguin.addCoins(coins);
				}
				
				Promise.each(itemsArray, (item) => {
					penguin.inventory.push(item);
				}).then(() => {
					penguin.database.update_column(penguin.id, 'Inventory', penguin.inventory.join('%'), function() {
						penguin.database.updateUnlockCode(id, 'Redeemed', redeemedArray.join(','));
						penguin.send('rsc', -1, type, items, coins);
					});
				});
			});
		});
	}
}