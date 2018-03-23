var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var Promise = require("bluebird");
var EventEmitter = require('events');

require('../world/stamps.js')();

/* Mascots Service */

MascotEvent = new EventEmitter();

stampByMascotId = {
	1: 33, //aunt arctic
	2: 7, //rockhopper
	3: 8, //gary
	4: 34, //g billy
	5: 32, //franky
	6: 36, //stompin bob
	7: 35, //petey k
	8: 31, //cadence
	9: 466, //herbert
	10: 448, //ph
	12: 290, //sensei
	13: 358, //rookie
	7558: 599, //dj maxx
	884: 600, //jet pack guy
	1316247: 4678, //dot,
	8177: 601 //rory
};

MascotEvent.on('MascotEnterRoom', (penguin) => {
	if(!penguin.mascot) {
		return;
	}
	
	Promise.each(penguin.room.players, (player) => {
		if(stampByMascotId[penguin.id] !== undefined && penguin.id !== player.id) {
			player.addStamp(stampByMascotId[penguin.id]);
		}
	});
});

MascotEvent.on('AddPlayer', (penguin) => {
	Promise.each(penguin.room.players, (player) => {
		if(player.mascot) {
			if(stampByMascotId[player.id] !== undefined && player.id !== penguin.id) {
				penguin.addStamp(stampByMascotId[player.id]);
			}
		}
	});
});

module.exports.MascotEvent = MascotEvent;