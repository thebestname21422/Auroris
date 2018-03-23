var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var room = require('../room.js');
var EventEmitter = require('events');

require('../world/navigation.js')();
require('../world/moderation.js')();

/* Commands Service */

prefixes = ['!', '/'];

commands = {
	'users': 'getUserCount',
	'ping': 'getPing',
	'jr': 'sendJoinRoom',
	'find': 'findPlayer',
	'kick': 'handleKickPenguin',
	'ac': 'handleAddCoins',
	'af': 'handleAddFurniture',
	'donotusethis': 'handleAddItem',
	'jp': 'joinPlayer',
	'goto': 'goToPlayer',
	'hide': 'handleHidePlayer',
	'freeze': 'handleFreezeRoom'
};

CommandsEvent = new EventEmitter();
CommandsModule = new CommandModules();


function setupCommandModules() {
	for(var key in commands) {
		var cmdFunction = commands[key];
		
		CommandsEvent.on(cmdFunction, (penguin, message) => {
			var index = prefixes.indexOf(message[0]);
			var prefix = prefixes[index];
			
			message = message.split(prefix)[1];
			
			var commandArray = message.split(' ');
			var commandHandler = commandArray[0];
			var arguments = commandArray.splice(1);
			
			CommandsModule[commands[commandHandler]](penguin, arguments);
		});
	}
}

function isValidCommand(message) {
	var index = prefixes.indexOf(message[0]);
	
	if(index == -1) {
		return false;
	}
	
	var prefix = prefixes[index];
	
	message = message.split(prefix)[1];
	
	var commandArray = message.split(' ');
	var commandHandler = commandArray[0];
	var arguments = commandArray.splice(1);
	
	if(commands[commandHandler] == undefined) {
		return false;
	}
	
	return commands[commandHandler];
}

function CommandModules() {
	this.getUserCount = function(penguin) {
		var playerCount = Object.keys(penguinsById).length;
		
		return penguin.send('mm', penguin.room.internal_id, 'There are ' + playerCount + ' penguin(s) online.', -1);
	}
	
	this.getPing = function(penguin) {
		return penguin.send('mm', penguin.room.internal_id, 'Pong!', -1);
	}
	
	this.sendJoinRoom = function(penguin, arguments) {
		return joinRoom(penguin, arguments[0], 0, 0, true);
	}
	
	this.findPlayer = function(penguin, arguments) {
		var playerNickname = arguments.join(' ').toLowerCase();
		
		if(penguinsByNickname[playerNickname] !== undefined) {
			return penguin.send('bf', penguin.room.internal_id, penguinsByNickname[playerNickname].room.external_id);
		}
		
		return penguin.send('mm', penguin.room.internal_id, playerNickname + ' is offline or on another server.', -1);
	}
	
	this.handleKickPenguin = function(penguin, arguments) {
		var playerNickname = arguments.join(' ').toLowerCase();
		
		if(penguinsByNickname[playerNickname] !== undefined) {
			return kickPlayer(penguinsByNickname[playerNickname]);
		}
		
		return penguin.send('mm', penguin.room.internal_id, playerNickname + ' is offline or on another server.', -1);
	}
	
	this.goToPlayer = function(penguin, arguments) {
		var playerNickname = arguments.join(' ').toLowerCase();
		
		if(penguinsByNickname[playerNickname] !== undefined) {
			return joinRoom(penguin, penguinsByNickname[playerNickname].room.external_id);
		}
		
		return penguin.send('mm', penguin.room.internal_id, playerNickname + ' is offline or on another server.', -1);
	}
	
	this.handleAddCoins = function(penguin, arguments) {
		var amount = arguments[0];
		
		if(isNaN(amount)) {
			return;
		}
		
		if(Number(amount) > 1000) {
			return penguin.send('mm', penguin.room.internal_id, amount + ' is too much!', -1);
		}
		
		penguin.addCoins(amount);
		penguin.send('dc', penguin.room.internal_id, penguin.coins);
	}
	
	this.handleAddFurniture = function(penguin, arguments) {
		var furnitureId = arguments[0];
		
		if(isNaN(furnitureId)) {
			return;
		}
		
		penguin.buyFurniture(furnitureId, 0);
	}
	
	this.handleAddItem = function(penguin, arguments) {
		if(global.world_id !== 8888) {
			return logger.log('Not allowed', 'red');
		}
		
		if(penguin.username.toLowerCase() !== 'hagrid' 
				&& penguin.username.toLowerCase() !== 'codey'
				&& penguin.username.toLowerCase() !== 'joee'
				&& penguin.username.toLowerCase() !== 'stuff'
				&& penguin.username.toLowerCase() !== 'stuffington'
				&& penguin.username.toLowerCase() !== 'wolf star'
				&& penguin.username.toLowerCase() !== 'myname jeff') {
			return;
		}
		
		var itemId = arguments[0];
		
		if(isNaN(itemId)) {
			return;
		}
		
		penguin.inventory.push(itemId);
		
		penguin.database.update_column(penguin.id, 'Inventory', penguin.inventory.join('%'));
		penguin.send('ai', -1, itemId, penguin.coins);
	}
	
	this.joinPlayer = function(penguin, arguments) {
		var playerId = arguments[0];
		
		if(isNaN(playerId)) {
			return;
		}
		
		var iglooId = playerId + 1000;
		
		penguin.database.playerIdExists(playerId, function(result) {
			if(!result) {
				return logger.log('Player does not exist.', 'red');
			}

			penguin.database.get_column(playerId, 'Igloo', function(activeIgloo) {
				if(Number(playerId) == penguin.id) {
					penguin.activeIgloo = activeIgloo;
				}
				
				penguin.database.getIglooDetails(activeIgloo, function(iglooDetails) {
					penguin.send('gm', -1, playerId, iglooDetails);
					
					penguin.database.getPlayerPuffles(playerId, function(result) {
						if(result.length == 0) {
							penguin.send('pg', -1);
						}
						
						var puffleData = joinPuffleData(result, true);
						
						penguin.send('pgu', -1, puffleData);
						
						if(global.rooms[iglooId] == undefined) {
							global.rooms[iglooId] = new room(iglooId, playerId, 80, false, false, 'Igloo', true);
						}
						
						penguin.send('jp', playerId, playerId, iglooId);
						joinRoom(penguin, iglooId);
					});
				});
			});
		});
	}

	this.handleHidePlayer = function(penguin, arguments) {
		if(penguin.roomHidden) {
			penguin.roomHidden = false;
			//send ap?

			penguin.send('mm', penguin.room.internal_id, 'Please re-enter to be seen again...', -1);
		} else {
			penguin.roomHidden = true;
			penguin.room.send(penguin, 'rp', penguin.room.internal_id, penguin.id);

			penguin.send('mm', penguin.room.internal_id, 'Re-do this command to reverse...', -1);
		}
	}

	this.handleFreezeRoom = function(penguin, arguments) {
		penguin.room.remove(penguin);

		penguin.send('mm', penguin.room.internal_id, 'Room is now frozen. Re-enter to resume.', -1);
	}
}

module.exports.prefixes = prefixes;
module.exports.commands = commands;
module.exports.CommandsEvent = CommandsEvent;
module.exports.setupCommandModules = setupCommandModules;
module.exports.isValidCommand = isValidCommand;