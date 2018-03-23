var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var EventEmitter = require('events');

CEvent = new EventEmitter();

/* Games - z# */
module.exports = function() {
	
	this.calculationsByGame = {
		220: ['findFourScore', 'Find Four'],
		221: ['findFourScore', 'Find Four'],
		
		904: ['coinScore', 'Ice Fishing'],
		905: ['cartScore', 'Cart Surfer'],
		906: ['coinScore', 'Jetpack Adventure'],
		912: ['coinScore', 'Catchin Waves'],
		916: ['coinScore', 'Aqua Grabber'],
		917: ['coinScore', 'Paint By Letters'],
		918: ['coinScore', 'Paint By Letters'],
		919: ['coinScore', 'Paint By Letters'],
		950: ['coinScore', 'System Defender'],
		952: ['coinScore', 'Dance Contest'],
		
		900: ['divideScore', 'Astro Barrier'],
		901: ['divideScore', 'Bean Counters'],
		902: ['divideScore', 'Puffle Round-Up'],
		903: ['divideScore', 'Hydro Hopper'],
		909: ['divideScore', 'Thin Ice'],
		910: ['divideScore', 'Pizzatron 3000'],
		949: ['divideScore', 'Puffle Rescue'],
		955: ['divideScore', 'Puffle Launch'],
		
		999: ['sledScore', 'Sled Racing']
	};
	
	CEvent.on('coinScore', (penguin, score) => {
		var coins = Number(score);
		
		if(Number(score) < 5) {
			coins = 0;
		}

		if(penguin.throttle['zo'] != undefined) {
			if(penguin.throttle['zo'][0] >= 20) return AACEvent.emit('BanOffense', penguin, 24, 'Coin manipulation ({0})'.format(penguin.room.name));
		}
		
		sendGameOver(penguin, coins);
	});
	
	CEvent.on('divideScore', (penguin, score) => {
		var coins = Math.floor(Number(score) / 10);
		
		if(Number(score) < 5) {
			coins = 0;
		}

		if(penguin.throttle['zo'] != undefined) {
			if(penguin.throttle['zo'][0] >= 20) return AACEvent.emit('BanOffense', penguin, 24, 'Coin manipulation ({0})'.format(penguin.room.name));
		}
		
		sendGameOver(penguin, coins);
	});
	
	CEvent.on('sledScore', (penguin, score) => {
		var coins = 0;
		
		switch(Number(score)) {
			case 1:
				coins = 20;
			break;
			case 2:
				coins = 10;
			break;
			case 3:
				coins = 5;
			break;
		}

		sendGameOver(penguin, coins);
	});
	
	CEvent.on('cartScore', (penguin, score) => {
		let coins = Number(score);
		let boardScore = 0;
		let throttle = 0;
		
		if(Number(score) < 5) coins = 0;

		if(coins >= 100) {
			logger.log('Game Mode {0}'.format(penguin.gameMode), 'cyan');

			switch(penguin.gameMode) {
				case 1:
					boardScore = coins * 10;
					break;
				case 2:
					boardScore = coins * 20;
					break;
			}

			if(boardScore >= 500000) boardScore = Math.floor(boardScore / 2);

			if(penguin.throttle['zo'] !== undefined) {
				//boardScore = Math.floor(boardScore / 2);

				if(penguin.throttle['zo'][0] >= 5) boardScore = 0; //spam protection
				if(penguin.throttle['zo'][0] >= 1 && boardScore >= 10000) return AACEvent.emit('BanOffense', penguin, 24, 'Leaderboard/Coin manipulation (Cart Surfer)');
			}
		}

		logger.log('Leaderboard::Adding score {0}'.format(boardScore), 'cyan');

		if(boardScore > 10 && !isNaN(boardScore)) updatePlayerLeaderboard(penguin, boardScore);
		
		sendGameOver(penguin, coins);
	});
	
	this.sendGameOver = function(penguin, coins) {
		let totalCoins = 0;

		if(global.game_stamps[penguin.room.external_id] !== undefined) {
			let stampArray = global.game_stamps[penguin.room.external_id];
			let totalGameStamps = stampArray.length;
			let myCollectedStamps = [];
			
			for(let index in penguin.stamps) {
				if(stampArray.indexOf(Number(penguin.stamps[index])) >= 0) {
					myCollectedStamps.push(penguin.stamps[index]);
				}
			}
			
			let myTotalGameStamps = myCollectedStamps.length;
			
			if(myTotalGameStamps == totalGameStamps) coins = coins * 2;
			
			totalCoins = penguin.addCoins(coins);
			penguin.send('zo', penguin.room.internal_id, totalCoins, myCollectedStamps.join('|'), myCollectedStamps.length, totalGameStamps, totalGameStamps);
		} else {
			totalCoins = penguin.addCoins(coins);
			penguin.send('zo', penguin.room.internal_id, totalCoins, '', 0, 0, 0);
		}

		penguin.gameMode = 1; //reset
	}
	
	this.handleGameOver = function(penguin, data) {
		if(!penguin.joined) {
			return network.removePenguin(penguin);
		}

		let score = data[0];
	
		if(isNaN(score)) {
			return network.removePenguin(penguin);
		}
		
		if(!penguin.room.is_game && penguin.room.external_id !== 999) {
			return network.removePenguin(penguin);
		}
		
		if(score > 99991) {
			WebhookEvent.emit('coin-log', {
				'Type': 'Coin Exploit',
				'Player': penguin.id + ':' + penguin.username,
				'Score': score,
				'Current Coins': penguin.coins,
				'Game ID': penguin.room.external_id,
				'Game Name': penguin.room.name,
				'Action': 'Divided score by 100',
				'Edit Player': 'https://team.cprewritten.net/edit_player.php?playerId=' + penguin.id
			});
			
			score = Number(score / 100);
		}
		
		let emit = calculationsByGame[penguin.room.external_id];
		
		if(emit != undefined) {
			logger.log('Game: ' + penguin.room.name, 'green');
			CEvent.emit(emit[0], penguin, score);
		} else {
			logger.log('Game: ' + penguin.room.name, 'red');
			CEvent.emit('divideScore', penguin, score);
		}
	}
	
	this.getGameData = function(penguin, data) {
		penguin.database.get_column(penguin.id, 'GameData', function(gameData) {
			penguin.send('ggd', penguin.room.internal_id, gameData);
		});
	}
	
	this.saveGameData = function(penguin, data) {
		var gameData = data[0];
		
		penguin.database.update_column(penguin.id, 'GameData', gameData);
	}
}
