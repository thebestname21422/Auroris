var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* Igloo - g# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.getActiveIgloo = function(penguin, data) {
		var playerId = data[0];

		penguin.database.playerIdExists(playerId, function(result) {
			if(!result) {
				return network.removePenguin(penguin);
			}

			penguin.database.get_column(playerId, 'Igloo', function(activeIgloo) {
				if(Number(playerId) == penguin.id) {
					penguin.activeIgloo = activeIgloo;
				}
				
				penguin.database.getIglooDetails(activeIgloo, function(iglooDetails) {
					penguin.send('gm', -1, playerId, iglooDetails);
				});
			});
		});
	}
	
	this.openIgloo = function(penguin, data) {
		var playerId = data[0];
		
		if(Number(playerId) !== penguin.id) {
			return;
		}
		
		global.openIgloos[penguin.id] = penguin.name();
	}
	
	this.closeIgloo = function(penguin, data) {
		var playerId = data[0];
		
		if(Number(playerId) !== penguin.id) {
			return;
		}
		
		delete global.openIgloos[penguin.id];
	}
	
	this.getOwnedIgloos = function(penguin, data) {
		var igloos = penguin.igloos.join('|');
		
		penguin.send('go', penguin.room.internal_id, igloos);
	}
	
	this.getFurnitureList = function(penguin, data) {
		var furnitureInventory = [];
		
		for(var key in penguin.furniture) {
			var furnitureId = key;
			var furnitureQuantity = penguin.furniture[furnitureId];
			var furnitureDetails = [furnitureId, furnitureQuantity].join('|');
			
			furnitureInventory.push(furnitureDetails);
		}
		
		penguin.send('gf', penguin.room.internal_id, furnitureInventory.join('%'));
	}
	
	this.saveIglooFurniture = function(penguin, data) {
		let furniture = data;
		
		if(furniture.length < 1) {
			return penguin.database.updateIglooColumn(penguin.activeIgloo, 'Furniture', '');
		}
		
		if(furniture.length == 99) {
			penguin.addStamp(23); //full house stamp
		}

		if(furniture.length > 99) {
			return penguin.send('e', penguin.room.internal_id, 10006);
		}
		
		for(var index in furniture) {
			let furnitureArray = furniture[index].split('|');
			var furnitureId = Number(furnitureArray[0]);
			
			if(furnitureArray.length != 5) {
				return;
			}
			
			if(global.furniture[furnitureId] == undefined) {
				return;
			}			
			
			if(penguin.furniture[furnitureId] == undefined) {
				return;
			}
		}
		
		penguin.database.updateIglooColumn(penguin.activeIgloo, 'Furniture', furniture.join(','));
	}
	
	this.updateIglooMusic = function(penguin, data) {
		var musicId = data[0];
		
		if(isNaN(musicId)) {
			return;
		}
		
		penguin.database.updateIglooColumn(penguin.activeIgloo, 'Music', musicId);
	}
	
	this.sendServerIglooList = function(penguin, data) {
		if(global.openIgloos.length == 0) {
			return penguin.send('gr', penguin.room.internal_id);
		}
		
		if(Object.keys(global.openIgloos).length == 0) {
			return penguin.send('gr', penguin.room.internal_id);
		}
		
		var iglooList = [];
		
		for(var index in Object.keys(global.openIgloos)) {
			var playerId = Object.keys(global.openIgloos)[index];
			var playerNickname = global.openIgloos[playerId];
			var iglooDetails = [playerId, playerNickname].join('|');
			
			iglooList.push(iglooDetails);
		}
		
		penguin.send('gr', penguin.room.internal_id, iglooList.join('%'));
	}
	
	this.buyIglooFloor = function(penguin, data) {
		var floorId = data[0];
		
		if(global.floors[floorId] == undefined) {
			return penguin.send('e', penguin.room.internal_id, 402);
		}
		
		var cost = global.floors[floorId];
		
		if(penguin.coins < cost) {
			return penguin.send('e', penguin.room.internal_id, 401);
		}
		
		penguin.buyFloor(floorId, cost);
	}
	
	this.buyIglooType = function(penguin, data) {
		var iglooId = data[0];
		
		if(global.igloos[iglooId] == undefined) {
			return penguin.send('e', penguin.room.internal_id, 402);
		}
		
		if(penguin.igloos.indexOf(iglooId) >= 0) {
			return penguin.send('e', penguin.room.internal_id, 500);
		}
		
		var cost = global.igloos[iglooId];
		
		if(penguin.coins < cost) {
			return penguin.send('e', penguin.room.internal_id, 401);
		}
		
		penguin.buyIgloo(iglooId, cost);
	}
	
	this.updateIglooType = function(penguin, data) {
		var iglooId = data[0];
		
		if(penguin.igloos.indexOf(iglooId) == -1) {
			return;
		}
		
		penguin.database.updateIglooColumn(penguin.activeIgloo, 'Type', iglooId);
		penguin.database.updateIglooColumn(penguin.activeIgloo, 'Floor', 0);
	}
	
	this.buyFurniture = function(penguin, data) {
		var furnitureId = data[0];
		
		if(isNaN(furnitureId)) {
			return;
		}
		
		if(global.furniture[Number(furnitureId)] == undefined) {
			return penguin.send('e', penguin.room.internal_id, 402);
		}
		
		var cost = global.furniture[furnitureId];
		
		if(penguin.coins < cost) {
			return penguin.send('e', penguin.room.internal_id, 401);
		}
		
		penguin.buyFurniture(furnitureId, cost);
	}
}