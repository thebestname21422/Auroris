let logger = require('../../util/logger.js');
let network = require('../../util/network.js');
let Promise = require("bluebird");

require('./mail.js')();

/* Leaderboard - lb# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.getLeaderboardList = async function(penguin, data) {
		let record = 0;
		let gameId = penguin.room.external_id;
		let leaderboardData = await penguin.database.engine.getLeaderboardByGameId(gameId);
		let leaderboardList = await Promise.map(leaderboardData, (p, i) => [p.ID, p.Name, (i + 1), p.Score, p.LastPlayed].join('|'));

		if(leaderboardData != undefined && leaderboardData.length > 0) record = leaderboardData[0].Score;

		penguin.send('glb', penguin.room.internal_id, gameId, record, leaderboardList.join(','), getResetDays());

		checkPlayerRanking(penguin, gameId);
	}

	this.updatePlayerLeaderboard = async function(penguin, score) {
		if(isNaN(score) || score == undefined) return;

		let timestamp = Math.floor(getServerTime().getTime() / 1000);
		let gameId = penguin.room.external_id;

		if(!await penguin.database.engine.playerOnLeaderboard(penguin.id)) { //insert if not on leaderboard
			let leaderboard = await penguin.database.engine.getLeaderboardByGameId(gameId);

			if(Number(score) < 15000 && leaderboard.length < 1) return; //need 15k if leaderboard is empty

			await penguin.database.engine.insertLeaderboardPlayerByGameId(gameId, {id: penguin.id, name: penguin.name(), score: score, lastplayed: timestamp});

			return checkPlayerRanking(penguin);
		}

		let leaderboardData = await penguin.database.engine.getLeaderboardByPlayerId(penguin.id);
		let boardScore = leaderboardData.Score;

		if(Number(score) < Number(boardScore)) return;

		await penguin.database.engine.updateColumn('leaderboard', 'Score', 'ID', score, penguin.id);

		penguin.database.engine.updateColumn('leaderboard', 'LastPlayed', 'ID', timestamp, penguin.id); //don't need a result

		checkPlayerRanking(penguin, gameId);
	}

	this.checkPlayerRanking = async function(penguin, gameId) {
		let leaderboardData = await penguin.database.engine.getLeaderboardByGameId(gameId);

		if(leaderboardData[0] == undefined) return; //leaderboard empty

		let winnerId = leaderboardData[0].ID;
		let hasPrize = leaderboardData[0].HasPrize;
		let score = leaderboardData[0].Score;

		if(Number(winnerId) == penguin.id && Number(hasPrize) == 0) {
			return addTopAward(penguin, score, gameId);
		}
	}

	this.addTopAward = async function(penguin, score, gameId) {
		switch(Number(gameId)) {
			case 905: //cart surfer
				penguin.addItem(4125, 0);
				sendSystemMail(penguin, penguin.id, score, 242);
				break;
		}

		penguin.database.engine.updateColumn('leaderboard', 'HasPrize', 'ID', 1, penguin.id);
	}

	this.getResetDays = function() {
		return Math.floor((6 - getServerTime().getDay()) + 1);
	}

	this.handleSetGameMode = function(penguin, data) {
		if(isNaN(data[0])) return;

		let gameMode = Number(data[0]);

		if(gameMode == 1 || gameMode == 2) penguin.gameMode = gameMode;

		penguin.send('sgm', penguin.room.internal_id, gameMode);
	}
}