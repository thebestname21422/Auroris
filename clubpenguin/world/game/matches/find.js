let network = require('../../../../util/network.js');
let logger = require('../../../../util/logger.js');
let range = require("range").range;

function FindFour() {
	this.players = [];
	this.spectators = [];

	this.board = range(7).map(c => range(6).map(r => 0));

	this.seatTurn = 0;
	this.lastTurn = -1;
	this.win = {x: -1, y: -1}; //defaults
	this.direction = 0;

	this.MAX_STREAK = 4;
	this.ROWS = 6;
	this.COLUMNS = 7;

	this.INVALID_PLACE = -1;
	this.PLACED = 0;
	this.GAME_WIN = 1;
	this.GAME_TIE = 2;
	this.GAME_NOFIND = 3;

	this.COINWIN_VERTICAL = 1;
	this.COINWIN_HORIZONTAL = 2;
	this.COINWIN_D_LEFT = 3;
	this.COINWIN_D_RIGHT = 4;

	this.finished = false;

	logger.log('BOARD::{0}x{1}'.format(this.COLUMNS, this.ROWS), 'cyan');

	this.boardToString = function() {
		let boardString = this.board.map((row) => row.join(','));
		
		return boardString.join(',');
	}

	this.boardToArray = function() {
		let boardString = this.boardToString();

		return boardString.split(',').map(Number);
	}

	this.boardFull = function() {
		let board = this.boardToArray();

		if(board.indexOf(0) == -1) {
			return true;
		}

		return false;
	}

	this.playerSeatToIndex = function(seat) {
		return Math.floor(Number(seat) + 1);
	}

	this.boardAntiCheat = function(penguin, obj) {
		if(this.lastTurn == obj.seat) {
			logger.log('Seat spam attempt', 'red');

			return this.INVALID_PLACE;
		}

		if(obj.seat != this.seatTurn) {
			logger.log('Seat cheat attempt', 'red');

			return this.INVALID_PLACE;
		}

		if(this.board[obj.column][obj.row] !== 0) {
			logger.log('Board placement cheat attempt', 'red');

			return this.INVALID_PLACE;
		}

		if(this.board[(obj.column + 1)] !== undefined) {
			if(this.board[(obj.column + 1)][obj.row] == 0) {
				logger.log('Board gravity hax', 'red');

				return this.INVALID_PLACE;
			}
		}

		return this.PLACED;
	}

	this.columnCheck = function(column) {
		let streak = 0;

		this.direction = this.COINWIN_VERTICAL;

		for(let row of this.board) {
			if(row[column] != this.playerSeatToIndex(this.seatTurn)) {
				streak = 0;
				this.win = {x: 0, y: 0};
				continue;
			}

			streak++;

			if(streak == 1) this.win = {x: row, y: column};

			if(streak == this.MAX_STREAK) return this.GAME_WIN;
		}

		return this.GAME_NOFIND;
	}

	this.checkVerticalWin = function() {
		for(let column of range(Number(this.ROWS) + 1)) {
			if(this.columnCheck(column) == this.GAME_WIN) return this.GAME_WIN;
		}

		return this.GAME_NOFIND;
	}

	this.checkHorizontalWin = function() {
		let streak = 0;

		this.direction = this.COINWIN_HORIZONTAL;

		for(let row of this.board) {
			for(let chip of row) {
				if(chip == this.playerSeatToIndex(this.seatTurn)) {
					streak++;

					let column = row.indexOf(chip);

					if(streak == 1) this.win = {x: row, y: column};

					if(streak == this.MAX_STREAK) return this.GAME_WIN;
				} else {
					streak = 0;
					this.win = {x: 0, y: 0};
				}
			}
		}

		return this.GAME_NOFIND;
	}

	this.checkDiagonalWin = function() {
		let streak = 0;

		for(let row = 0; row < this.ROWS; row++) {
			let columns = Number(this.board[row].length + 1);

			for(let column = 0; column < columns; column++) {
				try {
					if(this.board[column][row] == this.playerSeatToIndex(this.seatTurn)) {
						if(this.board[column + 1] && this.board[column + 1][row + 1] == this.playerSeatToIndex(this.seatTurn) &&
							this.board[column + 2] && this.board[column + 2][row + 2] == this.playerSeatToIndex(this.seatTurn) &&
							this.board[column + 3] && this.board[column + 3][row + 3] == this.playerSeatToIndex(this.seatTurn)) {
								return this.GAME_WIN;
						}

						if(this.board[column - 1] && this.board[column - 1][row - 1] == this.playerSeatToIndex(this.seatTurn) &&
							this.board[column - 2] && this.board[column - 2][row - 2] == this.playerSeatToIndex(this.seatTurn) &&
							this.board[column - 3] && this.board[column - 3][row - 3] == this.playerSeatToIndex(this.seatTurn)) {
								return this.GAME_WIN;
						}

						if(this.board[column - 1] && this.board[column - 1][row + 1] == this.playerSeatToIndex(this.seatTurn) &&
							this.board[column - 2] && this.board[column - 2][row + 2] == this.playerSeatToIndex(this.seatTurn) &&
							this.board[column - 3] && this.board[column - 3][row + 3] == this.playerSeatToIndex(this.seatTurn)) {
								return this.GAME_WIN;
						}
					}
				}
				catch(e) {
					continue;
				}
			}
		}

		return this.GAME_NOFIND;
	}

	this.checkWin = function() {
		if(this.boardFull()) return this.GAME_TIE;

		if(this.checkVerticalWin() != this.GAME_NOFIND) return this.GAME_WIN;

		if(this.checkHorizontalWin() != this.GAME_NOFIND) return this.GAME_WIN;

		if(this.checkDiagonalWin() != this.GAME_NOFIND) return this.GAME_WIN;

		return this.PLACED;
	}

	this.movement = function(penguin, obj) {
		let seat = Number(obj.seat);
		let column = Number(obj.column);
		let row = Number(obj.row);

		if(this.boardAntiCheat(penguin, obj) == this.INVALID_PLACE) return false;

		this.board[column][row] = this.playerSeatToIndex(seat);

		this.direction = 0;

		let winStatus = this.checkWin();

		switch(winStatus) {
			case this.GAME_TIE:
				return this.gameOver(penguin);
			case this.GAME_WIN:
				return this.gameWin(penguin);
		}

		this.lastTurn = this.seatTurn;
		this.seatTurn == 0 ? this.seatTurn = 1 : this.seatTurn = 0;
	}

	this.gameWin = function(penguin) {
		this.finished = true;

		let nickname = this.players[this.seatTurn].name();

		logger.log('{0} WON!'.format(nickname), 'green');

		for(let player of this.players) {
			let coins;

			if(player.playerSeat == this.seatTurn) {
				coins = player.addCoins(20);
			} else {
				coins = player.addCoins(10);
			}

			player.send('zo', player.room.internal_id, coins, '', 0, 0, 0);
		}

		this.flushSpectators();
	}

	this.gameOver = function(penguin) {
		this.finished = true;

		for(let player of this.players) {
			let coins = player.addCoins(5);
			player.send('zo', player.room.internal_id, coins, '', 0, 0, 0);
		}

		this.flushSpectators();
	}

	this.flushSpectators = function() {
		for(let player of this.spectators) {
			player.send('zo', player.room.internal_id, coins, '', 0, 0, 0);
		}
	}
}

module.exports = FindFour;