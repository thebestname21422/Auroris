var network = require('../util/network.js');
var logger = require('../util/logger.js');
var Promise = require("bluebird");

function Room(external_id, internal_id, capacity, is_game, is_solo, name, is_igloo) {
	this.players = [];
	this.external_id = external_id;
	this.internal_id = internal_id;
	this.is_game = is_game;
	this.capacity = capacity;
	this.is_solo = is_solo;
	this.name = name;
	this.is_igloo = is_igloo;

	this.send = function(penguin, ...arguments) {
		var to_send = '%xt%' + arguments.join('%') + '%';
		
		Promise.each(this.players, (player) => {
			if(player.ignoresById[penguin.id] == undefined) {
				player.send_data(to_send);
			}
		});
	}
	
	this.getRoomString = function() {
		let availablePlayers = this.players.filter(p => p.roomHidden == false && penguinsById[p.id] !== undefined);
		let roomString = availablePlayers.map(p => p.getPlayerString());
	
		return roomString.join('%');
	}
	
	this.add = function(penguin) {	
		if(this.players.length > (this.capacity - 1) && penguin.moderator != true) {
			return penguin.send('e', this.internal_id, 210);
		}
	
		if(this.is_solo) {
			this.players = [];
		}
	
		this.players.push(penguin);

		let roomString = this.getRoomString();

		if(roomString.length == 0) { //hide command
			roomString = penguin.getPlayerString();
		}
	
		if(this.is_game) {
			penguin.send('jg', this.internal_id, this.external_id);
		} else {
			penguin.send('jr', this.internal_id, this.external_id, roomString);
	
			if(!this.is_solo) {
				this.send(penguin, 'ap', this.internal_id, penguin.getPlayerString());
			}
		}
	
		penguin.room = this;
		
		MascotEvent.emit('MascotEnterRoom', penguin);
		MascotEvent.emit('AddPlayer', penguin);
	}
	
	this.remove = function(penguin) {
		var index = this.players.indexOf(penguin);
	
		if(index == -1) {
			return;
		}
			
		this.players.splice(index, 1);
	
		this.send(penguin, 'rp', this.internal_id, penguin.id);
	}
}

module.exports = Room;
