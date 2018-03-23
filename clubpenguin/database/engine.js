const mysql = require('mysql');
const util = require('util');
const logger = require('../../util/logger.js');

class DatabaseEngine {
	constructor(mysqlConnection, parent) {
		this.connection = mysqlConnection;
		this.parent = parent;
	}

	async rowExists(table, column, value) {
		if(table == undefined || column == undefined || value == undefined) {
			return false;
		}

		let query = "SELECT " + column + " FROM " + table + " WHERE " + column + " = ?";
		let result = await this.connection.query(query, [value]);

		try {
			return result[0][0][column] == value;
		}
		catch(error) {
			return false;
		}

		return false;
	}

	async updateColumn(table, column, columnWhere, value, valueWhere) {
		if(table == undefined || column == undefined || value == undefined) {
			return false;
		}

		let query = "UPDATE {0} SET {1} = ? WHERE {2} = ?".format(table, column, columnWhere);
		let result = await this.connection.query(query, [value, valueWhere]);
	}

	async getColumnById(playerId, column) {
		if(playerId == undefined || column == undefined) {
			return undefined;
		}

		let query = "SELECT " + column + " FROM penguins WHERE ID = ?";
		let result = await this.connection.query(query, [playerId]);

		try {
			return result[0][0][column];
		}
		catch(error) {
			return undefined;
		}

		return undefined;
	}

	async playerIdExists(playerId) {
		if(playerId == null || playerId == undefined) {
			return false;
		}

		return await this.rowExists('penguins', 'ID', playerId);
	}

	async getLeaderboardByGameId(gameId) {
		if(gameId == undefined) {
			return undefined;
		}

		let query = "SELECT * FROM leaderboard WHERE GameID = ? ORDER BY Score DESC LIMIT 12";
		let result = await this.connection.query(query, [gameId]);

		try {
			return result[0] || [];
		}
		catch(error) {
			return undefined;
		}

		return undefined;
	}

	async getLeaderboardByPlayerId(playerId) {
		if(playerId == undefined) {
			return undefined;
		}

		let query = "SELECT * FROM leaderboard WHERE ID = ?";
		let result = await this.connection.query(query, [playerId]);

		try {
			return result[0][0] || [];
		}
		catch(error) {
			return undefined;
		}

		return undefined;
	}

	async playerOnLeaderboard(playerId) {
		if(playerId == null || playerId == undefined) {
			return false;
		}

		return await this.rowExists('leaderboard', 'ID', playerId);
	}

	async insertLeaderboardPlayerByGameId(gameId, obj) {
		if(gameId == undefined || obj == undefined) {
			return undefined;
		}

		let query = "INSERT INTO leaderboard (`ID`, `Name`, `Score`, `LastPlayed`, `GameID`) VALUES (?, ?, ?, ?, ?)";
		
		await this.connection.query(query, [obj.id, obj.name, obj.score, obj.lastplayed, gameId]);
	}
}

module.exports = DatabaseEngine;