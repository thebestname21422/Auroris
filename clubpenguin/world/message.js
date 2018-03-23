var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var commandsService = require('../events/commands.js');
var Promise = require("bluebird");

require('./moderation.js')();

setInterval(function() {
	global.mainDatabase.getFilterVersion(function(version) {			
		if(Number(version) !== Number(this.filterVersion)) {
			getFilter(global.mainDatabase);
		}
	});
}.bind(this), 600000);

/* Messaging - m# */
module.exports = function() {
	this.filterVersion = null;
	this.filterCategories = {};
	this.similarChars = {
		'i': ['j', 'l', '!'],
		'u': ['y', 'v'],
		'y': ['u'],
		'l': ['i', '!'],
		'!': ['i', 'l']
	};

	this.startDependency = function() {
		commandsService.setupCommandModules();

		global.getFilter = getFilter;

		logger.log('Message::Started', 'cyan');
	}

	this.getFilter = function(database, callback) {
		if(database == undefined) {
			return;
		}
		
		database.getSocialFilter(function(results) {
			if(results == undefined || results == null) {
				logger.log('Social Filter Not Loaded', 'red');
			}
			
			this.filterCategories['ban'] = results['ban'].split(',');
			this.filterCategories['kick'] = results['kick'].split(',');
			this.filterCategories['mute'] = results['mute'].split(',');
			this.filterCategories['whitelist'] = results['whitelist'].split(',');
			this.filterCategories['blacklist'] = results['blacklist'].split(',');
			this.filterCategories['strpos'] = results['strpos'].split(',');
			
			this.filterVersion = Number(results['version']);
			
			if(typeof(callback) == 'function') {
				return callback();
			}
		});
		
		logger.log('Social Filter Loaded', 'green');
	}
	
	this.sendMessageRequest = function(penguin, data) {
		let playerId = data[0];
		let message = data[1];
		
		if(Number(playerId) !== Number(penguin.id)) {
			return network.removePenguin(penguin);
		}

		if(global.serverSettings.safechat) return;
		if(penguin.muted) return;
		if(message.length > 48) return;
		
		let commandCheck = commandsService.isValidCommand(message.toLowerCase());
		
		if(commandCheck !== false && penguin.moderator) {
			return commandsService.CommandsEvent.emit(commandCheck, penguin, message);
		}

		if(filterVersion == null) {
			getFilter(penguin.database, function() {
				inspectMessage(penguin, message);
			});
		} else {
			inspectMessage(penguin, message);
		}
	}

	this.inspectMessage = async function(penguin, message) {
		let msg = {
			orig: message, 
			lower: message.toLowerCase(), 
			r: message.toLowerCase().replace(/[^a-zA-Z ]/g, ''),
			w: message.toLowerCase().split(' ')
		};

		console.log(msg);

		if(this.filterCategories['ban'].indexOf(msg.lower) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['kick'].indexOf(msg.lower) >= 0) return kickMessage(penguin, message);
		if(this.filterCategories['mute'].indexOf(msg.lower) >= 0) return sendBlockedMessage(penguin, message);
		if(this.filterCategories['blacklist'].indexOf(msg.lower) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['strpos'].indexOf(msg.lower) >= 0) return sendBlockedMessage(penguin, message);

		if(this.filterCategories['ban'].indexOf(msg.r) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['kick'].indexOf(msg.r) >= 0) return kickMessage(penguin, message);
		if(this.filterCategories['mute'].indexOf(msg.r) >= 0) return sendBlockedMessage(penguin, message);
		if(this.filterCategories['blacklist'].indexOf(msg.r) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['strpos'].indexOf(msg.r) >= 0) return sendBlockedMessage(penguin, message);

		let removeSpaces = msg.r.replace(/\s/g, '');

		if(this.filterCategories['ban'].indexOf(removeSpaces) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['kick'].indexOf(removeSpaces) >= 0) return kickMessage(penguin, message);
		if(this.filterCategories['mute'].indexOf(removeSpaces) >= 0) return sendBlockedMessage(penguin, message);
		if(this.filterCategories['blacklist'].indexOf(removeSpaces) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['strpos'].indexOf(removeSpaces) >= 0) return sendBlockedMessage(penguin, message);

		let duplicatesRemoved = msg.lower.split('').filter((c, i, s) => s.indexOf(c) == i).join('');

		if(this.filterCategories['ban'].indexOf(duplicatesRemoved) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['kick'].indexOf(duplicatesRemoved) >= 0) return kickMessage(penguin, message);
		if(this.filterCategories['mute'].indexOf(duplicatesRemoved) >= 0) return sendBlockedMessage(penguin, message);
		if(this.filterCategories['blacklist'].indexOf(duplicatesRemoved) >= 0) return banMessage(penguin, message);
		if(this.filterCategories['strpos'].indexOf(duplicatesRemoved) >= 0) return sendBlockedMessage(penguin, message);

		for(let char of Object.keys(similarChars)) {
			for(let _char of similarChars[char]) {
				let index = msg.lower.indexOf(_char);
				let _index = msg.r.indexOf(_char);
				let replacedWord;
				let replaceHalf;

				console.log('|', char, _char);

				if(index >= 0) {
					replacedWord = msg.lower.replace(new RegExp(_char, 'g'), char);
					replacedHalf = msg.lower.replace(_char, char);

					console.log('replacedWord', replacedWord);

					if(this.filterCategories['ban'].indexOf(replacedWord) >= 0) return banMessage(penguin, message);
					if(this.filterCategories['kick'].indexOf(replacedWord) >= 0) return kickMessage(penguin, message);
					if(this.filterCategories['mute'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['blacklist'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['strpos'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);

					if(this.filterCategories['ban'].indexOf(replacedHalf) >= 0) return banMessage(penguin, message);
					if(this.filterCategories['kick'].indexOf(replacedHalf) >= 0) return kickMessage(penguin, message);
					if(this.filterCategories['mute'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['blacklist'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['strpos'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
				}

				if(_index >= 0) {
					replacedWord = msg.r.replace(new RegExp(_char, 'g'), char);
					replacedHalf = msg.r.replace(_char, char);

					if(this.filterCategories['ban'].indexOf(replacedWord) >= 0) return banMessage(penguin, message);
					if(this.filterCategories['kick'].indexOf(replacedWord) >= 0) return kickMessage(penguin, message);
					if(this.filterCategories['mute'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['blacklist'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['strpos'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);

					if(this.filterCategories['ban'].indexOf(replacedHalf) >= 0) return banMessage(penguin, message);
					if(this.filterCategories['kick'].indexOf(replacedHalf) >= 0) return kickMessage(penguin, message);
					if(this.filterCategories['mute'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['blacklist'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
					if(this.filterCategories['strpos'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
				}
			}
		}

		for(let word of msg.w) {
			console.log(word);

			let safeWord = word.replace(/[^a-zA-Z ]/g, '');

			if(this.filterCategories['ban'].indexOf(word) >= 0) return banMessage(penguin, message);
			if(this.filterCategories['kick'].indexOf(word) >= 0) return kickMessage(penguin, message);
			if(this.filterCategories['mute'].indexOf(word) >= 0) return sendBlockedMessage(penguin, message);
			if(this.filterCategories['blacklist'].indexOf(word) >= 0) return sendBlockedMessage(penguin, message);
			if(this.filterCategories['strpos'].indexOf(word) >= 0) return sendBlockedMessage(penguin, message);

			if(this.filterCategories['ban'].indexOf(safeWord) >= 0) return banMessage(penguin, message);
			if(this.filterCategories['kick'].indexOf(safeWord) >= 0) return kickMessage(penguin, message);
			if(this.filterCategories['mute'].indexOf(safeWord) >= 0) return sendBlockedMessage(penguin, message);
			if(this.filterCategories['blacklist'].indexOf(safeWord) >= 0) return sendBlockedMessage(penguin, message);
			if(this.filterCategories['strpos'].indexOf(safeWord) >= 0) return sendBlockedMessage(penguin, message);

			for(let char of Object.keys(similarChars)) {
				for(let _char of similarChars[char]) {
					let index = word.indexOf(_char);
					let _index = safeWord.indexOf(_char);
					let replacedWord;
					let replacedHalf;

					console.log('|', char, _char);

					if(index >= 0) {
						replacedWord = word.replace(new RegExp(_char, 'g'), char);
						replacedHalf = word.replace(_char, char);

						console.log('replacedWord', replacedWord);

						if(this.filterCategories['ban'].indexOf(replacedWord) >= 0) return banMessage(penguin, message);
						if(this.filterCategories['kick'].indexOf(replacedWord) >= 0) return kickMessage(penguin, message);
						if(this.filterCategories['mute'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['blacklist'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['strpos'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);

						if(this.filterCategories['ban'].indexOf(replacedHalf) >= 0) return banMessage(penguin, message);
						if(this.filterCategories['kick'].indexOf(replacedHalf) >= 0) return kickMessage(penguin, message);
						if(this.filterCategories['mute'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['blacklist'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['strpos'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
					}

					if(_index >= 0) {
						replacedWord = safeWord.replace(new RegExp(_char, 'g'), char);
						replacedHalf = safeWord.replace(_char, char);

						if(this.filterCategories['ban'].indexOf(replacedWord) >= 0) return banMessage(penguin, message);
						if(this.filterCategories['kick'].indexOf(replacedWord) >= 0) return kickMessage(penguin, message);
						if(this.filterCategories['mute'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['blacklist'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['strpos'].indexOf(replacedWord) >= 0) return sendBlockedMessage(penguin, message);

						if(this.filterCategories['ban'].indexOf(replacedHalf) >= 0) return banMessage(penguin, message);
						if(this.filterCategories['kick'].indexOf(replacedHalf) >= 0) return kickMessage(penguin, message);
						if(this.filterCategories['mute'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['blacklist'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
						if(this.filterCategories['strpos'].indexOf(replacedHalf) >= 0) return sendBlockedMessage(penguin, message);
					}
				}
			}
		}

		for(let phrase of this.filterCategories['ban']) {
			if(phrase == msg.lower) return banMessage(penguin, message);
			if(phrase == msg.r) return banMessage(penguin, message);
			if(phrase == removeSpaces) return banMessage(penguin, message);
			if(phrase == duplicatesRemoved) return banMessage(penguin, message);
		}

		for(let phrase of this.filterCategories['kick']) {
			if(phrase == msg.lower) return kickMessage(penguin, message);
			if(phrase == msg.r) return kickMessage(penguin, message);
			if(phrase == removeSpaces) return kickMessage(penguin, message);
			if(phrase == duplicatesRemoved) return kickMessage(penguin, message);
		}

		for(let phrase of this.filterCategories['mute']) {
			if(phrase == msg.lower) return sendBlockedMessage(penguin, message);
			if(phrase == msg.r) return sendBlockedMessage(penguin, message);
			if(phrase == removeSpaces) return sendBlockedMessage(penguin, message);
			if(phrase == duplicatesRemoved) return sendBlockedMessage(penguin, message);
		}

		for(let phrase of this.filterCategories['blacklist']) {
			if(phrase == msg.lower) return sendBlockedMessage(penguin, message);
			if(phrase == msg.r) return sendBlockedMessage(penguin, message);
			if(phrase == removeSpaces) return sendBlockedMessage(penguin, message);
			if(phrase == duplicatesRemoved) return sendBlockedMessage(penguin, message);
		}

		for(let phrase of this.filterCategories['strpos']) {
			if(phrase == msg.lower) return sendBlockedMessage(penguin, message);
			if(phrase == msg.r) return sendBlockedMessage(penguin, message);
			if(phrase == removeSpaces) return sendBlockedMessage(penguin, message);
			if(phrase == duplicatesRemoved) return sendBlockedMessage(penguin, message);

			if(msg.lower.indexOf(phrase) >= 0) return sendBlockedMessage(penguin, message);
			if(msg.r.indexOf(phrase) >= 0) return sendBlockedMessage(penguin, message);
			if(removeSpaces.indexOf(phrase) >= 0) return sendBlockedMessage(penguin, message);
			if(duplicatesRemoved.indexOf(phrase) >= 0) return sendBlockedMessage(penguin, message);
		}

		return sendMessage(penguin, message);
	}
	
	this.checkMessage = function(penguin, message) {
		//rip
		let lowerMsg = message.toLowerCase();
		let lowerMsgR = lowerMsg.replace(/[^a-zA-Z ]/g, '');
		
		if(this.filterCategories['ban'].indexOf(String(lowerMsg)) >= 0) {
			return banMessage(penguin, message);
		} else if(this.filterCategories['kick'].indexOf(String(lowerMsg)) >= 0) {
			return kickMessage(penguin, message);
		} else if(this.filterCategories['mute'].indexOf(String(lowerMsg)) >= 0) {
			return sendBlockedMessage(penguin, message);
		}

		if(this.filterCategories['ban'].indexOf(String(lowerMsgR)) >= 0) {
			return banMessage(penguin, message);
		} else if(this.filterCategories['kick'].indexOf(String(lowerMsgR)) >= 0) {
			return kickMessage(penguin, message);
		} else if(this.filterCategories['mute'].indexOf(String(lowerMsgR)) >= 0) {
			return sendBlockedMessage(penguin, message);
		}
		
		let words = message.split(' ');
		for(var index in words) {
			var word = words[index];
			
			if(this.filterCategories['ban'].indexOf(String(word).toLowerCase()) >= 0) {
				return banMessage(penguin, message);
			} else if(this.filterCategories['kick'].indexOf(String(word).toLowerCase()) >= 0) {
				return kickMessage(penguin, message);
			} else if(this.filterCategories['mute'].indexOf(String(word).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			} else	if(this.filterCategories['blacklist'].indexOf(String(word).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			}
			
			var noSymbols = word.replace(/[^a-zA-Z ]/g, '');
			if(this.filterCategories['ban'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return banMessage(penguin, message);
			} else if(this.filterCategories['kick'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return kickMessage(penguin, message);
			} else if(this.filterCategories['mute'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			} else if(this.filterCategories['blacklist'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['ban']) {
			var word = this.filterCategories['ban'][index];
			
			if(word == lowerMsg) {
				return banMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return banMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['kick']) {
			var word = this.filterCategories['kick'][index];
			
			if(word == lowerMsg) {
				return kickMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return kickMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['mute']) {
			var word = this.filterCategories['mute'][index];
			
			if(word == lowerMsg) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['blacklist']) {
			var word = this.filterCategories['blacklist'][index];
			
			if(word == lowerMsg) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['strpos']) {
			var word = this.filterCategories['strpos'][index];
			
			if(word == lowerMsg) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(lowerMsg.indexOf(word) >= 0) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		return sendMessage(penguin, message);
	}
	
	this.banMessage = function(penguin, message) {
		banPlayer(penguin, message);
		
		logMessage(penguin, message, 'banned');
	}
	
	this.kickMessage = function(penguin, message) {
		kickPlayer(penguin);
		
		logMessage(penguin, message, 'kicked');
	}
	
	this.sendBlockedMessage = function(penguin, message) {
		for(var index in penguin.room.players) {
			var player = penguin.room.players[index];
			
			if(player.moderator) {
				player.send('mm', penguin.room.internal_id, message, penguin.id);
			}
		}
		
		logMessage(penguin, message, 'mod');
	}
	
	this.sendMessage = function(penguin, message) {
		penguin.room.send(penguin, 'sm', penguin.room.internal_id, penguin.id, message);
		
		logMessage(penguin, message, 'sent');
	}
	
	this.logMessage = function(penguin, message, action) {
		penguin.remote.storeMessage(penguin.id, penguin.name(), message, action.toUpperCase());
	}

	this.sendMascotMessage = function(penguin, data) {
		let messageId = data[0];

		if(!penguin.moderator) kickPlayer(penguin);

		penguin.room.send(penguin, 'sma', penguin.room.internal_id, penguin.id, messageId);
	}

	return this;
}