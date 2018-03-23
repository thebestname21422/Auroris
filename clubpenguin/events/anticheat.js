let logger = require('../../util/logger.js');
let network = require('../../util/network.js');
let Promise = require("bluebird");
let EventEmitter = require('events');
let chalk = require("chalk");

/* Auroris Anti-Cheat */

AACEvent = new EventEmitter();

AACEvent.on('BanOffense', (penguin, hours, reason) => {
	if(isNaN(hours) || !hours) return;
	if(reason == undefined || reason == null) reason = 'None';

	logger.log('AAC::Ban {0} {1} hour(s) for {2}'.format(penguin.name(), hours, reason), 'red');

	let date = new Date();

	date.setHours(date.getHours() + hours);

	let timestamp = date.getTime() / 1000;

	penguin.database.update_column(penguin.id, 'Banned', timestamp);
	penguin.send('e', penguin.room.internal_id, 800, message);

	//discord webhook

	network.removePenguin(penguin);
});

module.exports.AACEvent = AACEvent;