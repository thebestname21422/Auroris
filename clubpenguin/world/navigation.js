var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var room = require('../room.js');
var database = require('../database/database_manager.js');

require('./buddy.js')();
require('./pet.js')();
require('./stamps.js')();
require('./game/waddle.js')();
require('./game/table.js')();

/* Navigation - j# */
module.exports = function() {
	this.roomSpawns = [100, 110, 130, 200, 300, 400, 807];
	this.mascotIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 7558, 884, 1316247, 8177];

	this.startDependency = function() {
	}

	this.handleJoinServer = function(penguin, data) {
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
		
		if(penguinsById[Number(player_id)] !== undefined) { //already logged in
			return network.removePenguin(penguin);
		}

		penguin.database.get_column(penguin.id, 'LoginKey', function(db_key) {
			if(db_key !== world_hash) {
				penguin.send('e', -1, 101);
				return network.removePenguin(penguin);
			}
			
			if(penguin.socket.destroyed) {
				return network.removePenguin(penguin);
			}

			penguin.database.update_column(penguin.id, 'LoginKey', '');
			
			if(global.world_id !== 8888) {
				penguin.joinedServer = true;
				penguin.send('joincaptcha', -1);
			} else { //media2
				handleJoinWorld(penguin);
			}
		});
	}
	
	this.handleJoinWorld = function(penguin) {
		penguin.loadPenguin(function() {
			if(penguin.socket.destroyed) {
				return network.removePenguin(penguin);
			}
			
			if(penguinsById[Number(penguin.id)] !== undefined) { //already logged in
				return network.removePenguin(penguin);
			}
			
			var penguinTime = new Date();
			var penguinStandardTime = penguinTime.getTime();
			var serverTimezoneOffset = 7;
			
			var player_string = penguin.getPlayerString();
			let loadPlayer = [player_string, penguin.coins, penguin.chat, 1440, penguinStandardTime, penguin.age, 0, penguin.age, '', serverTimezoneOffset];

			penguin.send('js', -1, 1, Number(penguin.epf), Number(penguin.moderator), 1);
			
			if(mascotIds.indexOf(penguin.id) >= 0) {
				penguin.mascot = true;
			}
			
			getStamps(penguin, [penguin.id], function() {
				if(penguin.socket.destroyed) {
					return network.removePenguin(penguin);
				}
			
				sendBuddyOnline(penguin);
				
				getPuffles(penguin);
				
				penguin.send('lp', -1, loadPlayer.join('%'));
	
				penguin.joined = true;
				
				penguinsById[penguin.id] = penguin;
				penguinsByNickname[penguin.nickname.toLowerCase()] = penguin;
	
				var roomId = this.roomSpawns[Math.floor(Math.random() * this.roomSpawns.length)];
				
				if(global.world_id == 8888) {
					roomId = 220;
				}
				
				this.joinRoom(penguin, roomId);
				
				penguin.database.update_column(penguin.id, 'Online', 1);
				penguin.database.update_column(penguin.id, 'CurrentServer', global.world_id);
				penguin.database.setWorldDataById(global.world_id, 'worldPopulation', Object.keys(penguinsById).length);

				/*penguin.database.get_column(penguin.id, 'AnniversaryLogin', function(annivLogin) {
					console.log('anniv login', annivLogin);

					if(Number(annivLogin) == 0) {
						sendSystemMail(penguin, penguin.id, penguin.nickname, 300);
						penguin.database.update_column(penguin.id, 'AnniversaryLogin', 1);
					}
				});*/
			});
		});
	}

	this.handleJoinRoom = function(penguin, data) {
		if(!penguin.joined) {
			return network.removePenguin(penguin);
		}
		
		var roomId = data[0];
		var x = data[1];
		var y = data[2];
		
		if(isNaN(roomId) || isNaN(x) || isNaN(y)) {
			return;
		}

		penguin.gameMode = 1;
		
		leaveWaddle(penguin);
		leaveTable(penguin);

		joinRoom(penguin, roomId, x, y);
	}

	this.joinRoom = function(penguin, room_id, x = 0, y = 0, cmd = false) {
		if(room_id in rooms) {
			if(rooms[room_id].players.indexOf(penguin) >= 0 && rooms[room_id].is_igloo == false && cmd == false) {
				return network.removePenguin(penguin);
			}
			
           if(penguin.room !== undefined) {
				penguin.room.remove(penguin);
           }

			penguin.frame = 1;
			penguin.x = x;
			penguin.y = y;
			rooms[room_id].add(penguin);
		} else {
			return penguin.send('e', -1, -1);
		}
	}

	this.handleJoinPlayer = function(penguin, data) {
		if(!penguin.joined) {
			return network.removePenguin(penguin);
		}
		
		let playerId = data[0] - 1000;
		let owner;

		penguin.database.playerIdExists(playerId, function(result) {
			if(!result) {
				return network.removePenguin(penguin);
			}

			let internalId = playerId;
			let externalId = playerId + 1000;

			//if not buddy and igloo not open, return error
			if(penguin.buddiesById[playerId] == undefined && global.openIgloos[playerId] == undefined && penguin.id !== playerId) {
				return penguin.send('e', penguin.room.internal_id, 210);
			}

           if(rooms[externalId] == undefined) {
				rooms[externalId] = new room(externalId, internalId, 150, false, false, 'Igloo', true);
           }

			penguin.send('jp', internalId, playerId, externalId);
			this.joinRoom(penguin, externalId);

			if(penguinsById[playerId] !== undefined) {
				owner = penguinsById[playerId];

				//party host stamp
				if(rooms[externalId].players.length >= 10) {
					owner.addStamp(17);
				}

				//igloo party stamp
				if(rooms[externalId].players.length >= 30) {
					owner.addStamp(28);
				}
			}

			//puffle owner stamp
			if(Number(playerId) == penguin.id) {
				penguin.database.getPlayerPuffles(penguin.id, function(puffles) {
					if(puffles.length >= 16) penguin.addStamp(21);
				});
			}
		});
	}
}