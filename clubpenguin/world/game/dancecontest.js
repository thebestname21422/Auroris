let logger = require('../../../util/logger.js');
let network = require('../../../util/network.js');
let range = require("range").range;
let Promise = require("bluebird");

/* Dance Contest Instance */
module.exports = function() {
	this.danceLobby = {};
	this.danceLobby[0] = {players: {}, roomid: 1456}; //easy
	this.danceLobby[1] = {players: {}, roomid: 1457}; //medium
	this.danceLobby[2] = {players: {}, roomid: 1458}; //hard
	this.danceLobby[3] = {players: {}, roomid: 1459}; //extreme

	this.danceRooms = {};

	this.danceLevels = ['easy', 'medium', 'hard', 'extreme'];
	
	WaddleEvent.on('ChangeDifficulty-952', (penguin, data) => {
		logger.log('DanceContest::Start Game', 'green');

		if(isNaN(data[0])) return;

		let level = Number(data[0]);

		logger.log('DanceContest::Joining Lobby {0}'.format(this.danceLevels[level]), 'green');

		if(Object.keys(this.danceLobby[level].players).length == 0) {
			this.danceLobby[level].roomid++;
			this.danceRooms[this.danceLobby[level].roomid] = {songid: Math.floor((Math.random() * 5) + 0)};
		}

		if(Object.keys(this.danceLobby[level].players).length >= 4) {
			return penguin.send('jz', penguin.room.internal_id, this.danceLobby[level].roomid, false);
		}

		this.danceLobby[level].players[penguin.name()] = penguin;

		penguin.send('jz', penguin.room.internal_id, true, this.danceRooms[this.danceLobby[level].roomid].songid, 100000);
	});

	WaddleEvent.on('AbortGame-952', (penguin, data) => {
		logger.log('DanceContest::Leaving Lobby', 'green');

		Promise.each(Object.keys(this.danceLobby), level => {
			if(this.danceLobby[level].players[penguin.name()] != undefined) {
				delete this.danceLobby[level].players[penguin.name()];

				//update lobby players

				penguin.send('cz', penguin.room.internal_id);
			}
		});
	});
}