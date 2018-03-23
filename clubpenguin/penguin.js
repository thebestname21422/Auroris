var network = require('../util/network.js');
var logger = require('../util/logger.js');
var database = require('./database/database_manager.js');
var Promise = require("bluebird");

function Penguin(socket) {
	this.id;
	this.username;
	this.nickname;
	this.socket = socket;
	this.database;
	this.remote;
	this.key;
	this.stage = 0;
	this.identified = false;
	this.approved = false;
	this.moderator = false;
	this.epf = false;
	this.muted = false;
	this.inventory;
	this.igloos;
	this.furnitureList = [];
	this.furniture = {};
	this.ignores = {};
	this.ignoresById = [];
	this.buddies;
	this.buddiesById = [];
	this.buddylist = {};
	this.buddyRequests = {};
	this.frame = 1;
	this.room;
	this.colour;
	this.head;
	this.face;
	this.neck;
	this.body;
	this.hand;
	this.feet;
	this.flag;
	this.photo;
	this.x = 0;
	this.y = 0;
	this.activeIgloo;
	this.rank;
	this.coins;
	this.stamps;
	this.recentStamps = [];
	this.joined = false;
	this.walkingPuffle;
	this.waddleId;
	this.waddleRoom;
	this.throttle = []; //[quantity, timestamp]
	this.EPF = {};
	this.waddleId;
	this.waddleRoom;
	this.playerSeat;
	this.inWaddle = false;
	this.waddleRoomId;
	this.cards;
	this.ownedCards = [];
	this.cardsById = {};
	this.belt;
	this.ninja;
	this.tableId = null;
	this.log;
	this.cdu = 0;
	this.chat = 0;
	this.jitsuMatchesWon = 0;
	this.senseiBattle = false;
	this.mascot = false;
	this.authPassed = false;
	this.joinedServer = false;
	this.donateTotal = 0;
	this.roomHidden = false;
	this.ipAddress = '';
	this.gameMode = 1;
	this.hasVoted = 0;
	this.kickRequest = 0;

	this.start = function() {
		this.database = database.get_database();
		this.remote = database.getRemoteDatabase();
	}
	
	this.log = function(nickname, message, colour) {
		if(nickname == undefined) {
			nickname = this.name();
		}
		
		logger.penguinLog(message, colour, nickname);
	}

	this.send_data = function(data) {
       network.send_data(this.socket, data);
	}

	this.send = function(...arguments) {
       var to_send = '%xt%' + arguments.join('%') + '%';

       this.send_data(to_send);
   }
	
	this.name = function() {
		if(this.approved) {
			return this.nickname;
		} else {
			return 'P' + String(this.id);
		}
	}
	
	this.addStamp = function(stampId) {
		if(isNaN(stampId)) {
			return;
		}
		
		var stamps = this.stamps;
		if(stamps.indexOf(String(stampId)) == -1) {
			stamps.push(String(stampId));
			this.recentStamps.push(Number(stampId));
			this.database.update_column(this.id, 'Stamps', stamps.join(','));
			this.send('aabs', -1, stampId);
		}
	}
	
    this.addCoins = function(amount) {
        if(isNaN(amount)) {
            return;
        }

        this.coins = Number(this.coins) + Number(amount);
        this.database.update_column(this.id, 'Coins', this.coins);

        return this.coins;
    }
	
    this.subtractCoins = function(amount) {
        if(isNaN(amount)) {
            return;
        }

        this.coins = Number(this.coins) - Number(amount);
        this.database.update_column(this.id, 'Coins', this.coins);
    }
	
	this.addItem = function(itemId, cost = 0, showClient = true) {
		this.inventory.push(itemId);
		
		if(cost > 0) {
			this.subtractCoins(cost);
		}
		
		this.database.update_column(this.id, 'Inventory', this.inventory.join('%'));

		if(showClient) {
			this.send('ai', this.room.internal_id, itemId, this.coins);
		}
	}
	
	this.buyFurniture = function(furnitureId, cost = 0) {
		var furnitureQuantity = 1;
		
		if(this.furniture[furnitureId] !== undefined) {
			var furnitureQuantity = this.furniture[furnitureId];
			
			furnitureQuantity += 1;
			
			if(furnitureQuantity >= 100) {
				return;
			}
		}
		
		if(cost > 0) {
			this.subtractCoins(cost);
		}
		
		this.furniture[furnitureId] = furnitureQuantity;
		
		let furnitureList = [];
		for(var index in Object.keys(this.furniture)) {
			var furnId = Object.keys(this.furniture)[index];
			var furnitureQuantity = this.furniture[furnId];
			var furnitureDetails = [furnId, furnitureQuantity].join('|');
			
			if(furnId !== 0 && !isNaN(furnitureQuantity)) {
				furnitureList.push(furnitureDetails);
			}
		}
		
		this.database.update_column(this.id, 'Furniture', furnitureList.join(','), (function(result) {
			this.send('af', -1, furnitureId, this.coins);
        }).bind(this));
	}
	
	this.buyFloor = function(floorId, cost = 0) {
		if(cost > 0) {
			this.subtractCoins(cost);
		}
		
		this.database.updateIglooColumn(this.activeIgloo, 'Floor', floorId, (function(result) {
			this.send('ag', -1, floorId, this.coins);
		}).bind(this));
	}
	
	this.buyIgloo = function(iglooId, cost = 0) {
		this.igloos.push(iglooId);
		
		if(cost > 0) {
			this.subtractCoins(cost);
		}
		
		this.database.update_column(this.id, 'Igloos', this.igloos.join(','), (function(result) {
			this.send('au', -1, iglooId, this.coins);
        }).bind(this));
	}
	
	this.updateColour = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		var type = global.items[itemId][3];
		
		if(type !== 1) {
			return;
		}
		
		this.colour = itemId;
		
		this.room.send(this, 'upc', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Color', itemId);
	}
	
	this.updateHead = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 2) {
				return;
			}
		}

		this.head = itemId;
		
		this.room.send(this, 'uph', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Head', itemId);
	}
	
	this.updateFace = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 3) {
				return;
			}
		}

		this.face = itemId;
		
		this.room.send(this, 'upf', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Face', itemId);
	}
	
	this.updateNeck = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 4) {
				return;
			}
		}

		this.neck = itemId;
		
		this.room.send(this, 'upn', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Neck', itemId);
	}
	
	this.updateBody = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 5) {
				return;
			}
		}

		this.body = itemId;
		
		this.room.send(this, 'upb', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Body', itemId);
	}
	
	this.updateHand = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0 && global.puffleItems.indexOf(Number(itemId)) == -1) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 6) {
				return;
			}
		}

		this.hand = itemId;
		
		this.room.send(this, 'upa', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Hand', itemId);
	}
	
	this.updateFeet = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 7) {
				return;
			}
		}

		this.feet = itemId;
		
		this.room.send(this, 'upe', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Feet', itemId);
	}
	
	this.updatePhoto = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 9) {
				return;
			}
		}

		this.photo = itemId;
		
		this.room.send(this, 'upp', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Photo', itemId);
	}
	
	this.updateFlag = function(itemId) {
		if(this.inventory.indexOf(itemId) == -1 && Number(itemId) !== 0) {
			return;
		}
		
		if(Number(itemId) !== 0) {
			var type = global.items[itemId][3];
			
			if(type !== 8) {
				return;
			}
		}

		this.flag = itemId;
		
		this.room.send(this, 'upl', this.room.internal_id, this.id, itemId);
		
		this.database.update_column(this.id, 'Flag', itemId);
	}

    this.loadPenguin = function(callback) {
		let clothing = ['Color', 'Head', 'Face', 'Neck', 'Body', 'Hand', 'Feet', 'Photo', 'Flag'];
		let player = ['ID', 'Nickname', 'Inventory', 'Coins', 'Stamps', 'RegistrationDate', 'approved', 'Stripes', 'SafeChat', 'Voted'];
		let agent = ['EPF', 'FieldStatus'];
		let lists = ['Ignores', 'Buddies'];
		let igloo = ['Igloos', 'Furniture'];
		let ninja = ['Cards', 'NinjaBelt', 'NinjaPercentage'];
		
		let columnsArray = clothing.concat(player, agent, lists, igloo, ninja);
       this.database.get_columns(this.id, columnsArray, (function(row) {
			this.id = Number(row['ID']);
			this.nickname = row['Nickname'];
			this.inventory = row['Inventory'].split('%');
			this.igloos = row['Igloos'].split(',');
			this.buddies = row['Buddies'].split(',');
			this.colour = Number(row['Color']);
			this.head = Number(row['Head']);
			this.face = Number(row['Face']);
			this.neck = Number(row['Neck']);
			this.body = Number(row['Body']);
			this.hand = Number(row['Hand']);
			this.feet = Number(row['Feet']);
			this.photo = Number(row['Photo']);
			this.flag = Number(row['Flag']);
			this.coins = Number(row['Coins']);
			this.stamps = row['Stamps'].split(',');
			this.approved = Boolean(row['approved']);
			this.cards = row['Cards'].split('%');
			this.belt = Number(row['NinjaBelt']);
			this.ninja = Number(row['NinjaPercentage']);
			this.chat = Number(row['SafeChat']);
			this.hasVoted = Number(row['Voted']);
			
			[this.EPF['status'], this.EPF['points'], this.EPF['career']] = row['EPF'].split(',');
			this.EPF['field'] = row['FieldStatus'];
			
			var now = Math.floor(new Date() / 1000);

			this.age = Math.round((now - row['RegistrationDate']) / 86400);
			
			this.rank = 146 * Number(row['Stripes']);
			
			let furnitureList = row['Furniture'].split(',');
			
			if(furnitureList.length > 0) {
				Promise.each(furnitureList, (furnitureDetails) => {
					furnitureDetails = furnitureDetails.split('|');
					
					var furnitureId = Number(furnitureDetails[0]);
					var quantity = Number(furnitureDetails[1]);
					
					this.furniture[furnitureId] = quantity;
				});
			}
			
			let ignoreList = row['Ignores'].split(',');
			
			if(ignoreList.length > 0) {
				Promise.each(ignoreList, (ignoreDetails) => {
					ignoreDetails = ignoreDetails.split(':');
					
					var playerId = Number(ignoreDetails[0]);
					var playerNickname = String(ignoreDetails[1]);
					
					this.ignores[playerId] = playerNickname;
					this.ignoresById[playerId] = ignoreDetails;
				});
			}
			
			if(this.cards.length > 0) {
				Promise.each(this.cards, (cardString) => {
					var cardArray = cardString.split('|');
					var cardId = Number(cardArray[1]);
					
					this.ownedCards.push(cardId);
					this.cardsById[cardId] = cardString;
				});
			}

			/* remove belt progress */
			let beltItems = [4025, 4026, 4027, 4028, 4029, 4030, 4031, 4032, 4033, 104];

			if(this.belt == 0 && this.ninja == 0) {
				this.ninja = 0;
				this.database.update_column(this.id, 'NinjaPercentage', this.ninja);

				for(var index in beltItems) {
					var beltItem = beltItems[index];

					var _ind = this.inventory.indexOf(String(beltItem));

					if(_ind >= 0) {
						this.inventory.splice(_ind, 1);
					}
				}

				this.database.update_column(this.id, 'Inventory', this.inventory.join('%'));
			}

           return callback();
       }).bind(this));
	}

    this.getPlayerString = function() {
        return [
            this.id,
            this.name(),
            45,
            this.colour,
            this.head,
            this.face,
            this.neck,
            this.body,
            this.hand,
            this.feet,
            this.flag,
            this.photo,
            this.x,
            this.y,
            this.frame,
            1,
            this.rank
        ].join('|');
    }
}

module.exports = Penguin;
