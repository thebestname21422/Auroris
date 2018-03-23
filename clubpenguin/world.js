var logger = require('../util/logger.js');
var network = require('../util/network.js');
var fs = require('fs');
var dependencies = require('../configurations/dependencies.json');

var room = require('./room.js');
var cluster = require('cluster');
var events = require('events');
var threading = require('threads');

var event_emitter = new events.EventEmitter();

global.ThreadPool = new threading.Pool();

xt_handlers = {
	's': {
		'j#js': {event: 'handleJoinServer', throttle: false},
		'j#jr': {event: 'handleJoinRoom', throttle: true, interaction: true},
		'j#jp': {event: 'handleJoinPlayer', throttle: true, interaction: true},
		
		'f#epfga': {event: 'getAgentStatus', throttle: false},
		'f#epfsa': {event: 'setAgentStatus', throttle: false},
		'f#epfgf': {event: 'getFieldStatus', throttle: false},
		'f#epfsf': {event: 'setFieldStatus', throttle: false},
		'f#epfgr': {event: 'getAgentRank', throttle: false},
		'f#epfgrantreward': {event: 'grantReward', throttle: true},
		'f#epfai': {event: 'purchaseSpyGear', throttle: true},
		
		'i#gi': {event: 'getInventory', throttle: true},
		'i#ai': {event: 'buyInventory', throttle: true},
		'i#qpp': {event: 'getPlayerPins', throttle: true},
		'i#qpa': {event: 'getPlayerAwards', throttle: true},
		
		'b#gb': {event: 'getBuddies', throttle: true},
		'b#br': {event: 'sendBuddyRequest', throttle: true},
		'b#rb': {event: 'sendBuddyRemove', throttle: false},
		'b#ba': {event: 'acceptBuddy', throttle: false},
		'b#bf': {event: 'findBuddy', throttle: true},
		
		'n#gn': {event: 'getIgnores', throttle: true},
		
		'l#mst': {event: 'startMail', throttle: true},
		'l#mg': {event: 'getMail', throttle: true},
		'l#mc': {event: 'mailChecked', throttle: true},
		'l#ms': {event: 'sendMail', throttle: true},
		'l#md': {event: 'deleteMailItem', throttle: false},
		'l#mdp': {event: 'deleteMailItemFromPlayer', throttle: false},
		
		'st#gps': {event: 'getStamps', throttle: true},
		'st#sse': {event: 'addStamp', throttle: true},
		'st#gmres': {event: 'getRecentStamps', throttle: false},
		'st#gsbcd': {event: 'getBookCover', throttle: false},
		'st#ssbcd': {event: 'updateBookCover', throttle: true},
		
		'u#h': {event: 'sendHeartbeat', throttle: false, interaction: true},
		'u#se': {event: 'sendEmote', throttle: true, interaction: true},
		'u#ss': {event: 'sendSafeChat', throttle: true, interaction: true},
		'u#sg': {event: 'sendTourMessage', throttle: true, interaction: true},
		'u#sp': {event: 'sendPosition', throttle: false, interaction: true},
		'u#sb': {event: 'sendSnowball', throttle: true, interaction: true},
		'u#sf': {event: 'sendFrame', throttle: false, interaction: true},
		'u#sa': {event: 'sendAction', throttle: true, interaction: true},
		'u#sl': {event: 'sendLine', throttle: true, interaction: true},
		'u#sj': {event: 'sendJoke', throttle: true, interaction: true},
		'u#glr': {event: 'sendLastRevision', throttle: false},
		'u#gp': {event: 'getPlayer', throttle: true},
		'u#tp': {event: 'sendTeleport', throttle: true, enabled: false, interaction: true},
		'u#sma': {event: 'sendMascotMessage', throttle: false},
		
		's#upc': {event: 'updatePlayerClothing', throttle: true},
		's#uph': {event: 'updatePlayerClothing', throttle: false},
		's#upf': {event: 'updatePlayerClothing', throttle: false},
		's#upn': {event: 'updatePlayerClothing', throttle: false},
		's#upb': {event: 'updatePlayerClothing', throttle: false},
		's#upa': {event: 'updatePlayerClothing', throttle: false},
		's#upe': {event: 'updatePlayerClothing', throttle: false},
		's#upp': {event: 'updatePlayerClothing', throttle: false},
		's#upl': {event: 'updatePlayerClothing', throttle: false},
		
		'g#gm': {event: 'getActiveIgloo', throttle: true},
		'g#or': {event: 'openIgloo', throttle: false},
		'g#cr': {event: 'closeIgloo', throttle: false},
		'g#go': {event: 'getOwnedIgloos', throttle: true},
		'g#gf': {event: 'getFurnitureList', throttle: true},
		'g#ur': {event: 'saveIglooFurniture', throttle: true},
		'g#um': {event: 'updateIglooMusic', throttle: false},
		'g#gr': {event: 'sendServerIglooList', throttle: true},
		'g#ag': {event: 'buyIglooFloor', throttle: true},
		'g#au': {event: 'buyIglooType', throttle: true},
		'g#af': {event: 'buyFurniture', throttle: true},
		'g#ao': {event: 'updateIglooType', throttle: true},
		
		'm#sm': {event: 'sendMessageRequest', throttle: true},
		
		'p#pgu': {event: 'getPuffles', throttle: true},
		'p#pg': {event: 'getPufflesByPlayerId', throttle: true},
		'p#pt': {event: 'sendPuffleTreat', throttle: true},
		'p#pf': {event: 'sendPuffleFeed', throttle: true},
		'p#pip': {event: 'sendPuffleInitInteractionPlay', throttle: true},
		'p#pir': {event: 'sendPuffleInitInteractionRest', throttle: true},
		'p#ir': {event: 'sendPuffleInteractionRest', throttle: true},
		'p#ip': {event: 'sendPuffleInteractionPlay', throttle: true},
		'p#pr': {event: 'sendPuffleRest', throttle: true},
		'p#pp': {event: 'sendPufflePlay', throttle: true},
		'p#pb': {event: 'sendPuffleBath', throttle: true},
		'p#ps': {event: 'sendPuffleFrame', throttle: true},
		'p#pw': {event: 'sendPuffleWalk', throttle: true},
		'p#pm': {event: 'sendPuffleMove', throttle: true},
		'p#pn': {event: 'sendAdoptPuffle', throttle: true},
		
		'w#jx': {event: 'joinWaddle', throttle: false},
		
		'a#gt': {event: 'handleGetTables', throttle: false},
		'a#jt': {event: 'handleJoinTable', throttle: false},
		'a#lt': {event: 'handleLeaveTable', throttle: false},
		
		'r#cdu': {event: 'coinsDigUpdate', throttle: false},
		
		't#at': {event: 'openPlayerBook', throttle: true},
		't#rt': {event: 'closePlayerBook', throttle: true},
		
		'o#k': {event: 'kickPlayerById', throttle: false},
		'o#m': {event: 'mutePlayerById', throttle: false},
		
		'rewritten#captchaverify': {event: 'verifyCaptchaToken', throttle: true},

		'ni#gnr': {event: 'handleGetNinjaRank', throttle: false},
		'ni#gnl': {event: 'handleGetNinjaLevel', throttle: false},
		'ni#gwl': {event: 'handleGetWaterLevel', throttle: false},
		'ni#gfl': {event: 'handleGetFireLevel', throttle: false},
		'ni#gcd': {event: 'handleGetCardData', throttle: true},

		'lb#glb': {event: 'getLeaderboardList', throttle: true},
		'lb#sgm': {event: 'handleSetGameMode', throttle: true},

		'survey#playawards': {event: 'playAwards', throttle: true},
		'survey#chkv': {event: 'checkHasVoted', throttle: true}
	},

	'z': {
		'zo': {event: 'handleGameOver', throttle: true},
		
		'gw': {event: 'handleGetWaddles', throttle: false},
		'jw': {event: 'handleSendJoinWaddleById', throttle: false},
		'lw': {event: 'handleLeaveWaddle', throttle: false},
		'jz': {event: 'handleStartGame', throttle: false},
		'lz': {event: 'handleLeaveGame', throttle: false},
		'uz': {event: 'handleStartGame', throttle: false},
		'zm': {event: 'handleSendMove', throttle: false},
		
		'ggd': {event: 'getGameData', throttle: false},
		'sgd': {event: 'saveGameData', throttle: false},
		
		'm': {event: 'sendMovePuck', throttle: false},
		'gz': {event: 'getGame', throttle: false},
		'zd': {event: 'handleChangeDifficulty', throttle: false},
		'cz': {event: 'handleAbortGame', throttle: false},

		'jmm': {event: 'handleJoinMatchMaking', throttle: false},
		'lmm': {event: 'handleLeaveMatchMaking', throttle: false},

		'jsen': {event: 'handleJoinSensei', throttle: false}
	},
	
	'red': {
		'rjs': {event: 'handleRedemptionJoinServer', throttle: false},
		'rsc': {event: 'handleRedemptionSendCode', throttle: true}
	}
};

dependencyHandlers = {};

events_array = [];

global.rooms = {};
global.items = {};
global.igloos = {};
global.furniture = {};
global.floors = {};
global.game_stamps = {};
global.cards = {};
global.cardsById = {};
global.cardsObject = [];
global.epfItems = {};

global.postcards = [];
global.__stamps = [];
global.cardsArray = [];
global.pins = {};
global.pinArr = [];
global.awards = {};

global.puffles = {};
global.puffleItems = [];

global.openIgloos = {};

global.eventWhitelist = {};

function start(showLog) {
	if(global.worldType == 'login') return;
	
	for(var index in dependencies['world']) {
		var dependency = dependencies['world'][index];
		var dependencyName = dependency['name'];
		var dependencyDirectory = dependency['directory'];
		var dependencyExtension = dependency['extension'];
		var dependencyDetails = [dependencyDirectory, dependencyName, dependencyExtension];
		
		try {
			let handler = require(dependencyDetails.join(''));

			let func = handler();

			if(func != undefined) func.startDependency();

			dependencyHandlers[dependencyName] = func;
		} catch(error) {
			logger.log('DependencyLoader::Error > ' + error, 'red');
			logger.log(error.stack, 'red');
		}
	}
	
	for(var index in dependencies['services']) {
		var service = dependencies['services'][index];
		var serviceName = service['name'];
		var serviceDirectory = './events/';
		var serviceExtension = service['extension'];
		var serviceDetails = [serviceDirectory, serviceName, serviceExtension];
		
		try {
			require(serviceDetails.join(''));
		} catch(error) {
			logger.log('ServiceLoader::Error > ' + error, 'red');
		}
	}
	
    var _rooms = require('../crumbs/rooms.json');
	for(var index in _rooms) {
		var external_id = _rooms[index]['room_id'];
		var is_game = (_rooms[index]['path'] == '' ? true : false);
		var capacity = (_rooms[index]['capacity'] == undefined ? 80 : Number(_rooms[index]['capacity']));
		var solo = (_rooms[index]['is_solo'] == undefined ? false : true);
		var internal_id = Object.keys(rooms).length * 2;
		var name = _rooms[index]['display_name'];

       global.rooms[external_id] = new room(external_id, internal_id, capacity, is_game, solo, name, false);
    }

    var _stamps = require('../crumbs/stamps.json');
   for(var index in _stamps) {
       var stamp_cat = _stamps[index];

       if(stamp_cat['parent_group_id'] == 8) {
           for(var _index in stamp_cat['stamps']) {
               var stamp = stamp_cat['stamps'][_index];

               for(var __index in _rooms) {
                   var display = stamp_cat['display'];

                   if(display.replace('Games : ', '') == _rooms[__index]['display_name']) {
                       var room_id = _rooms[__index]['room_id'];

                       for(var i in stamp_cat['stamps']) {
                           global.__stamps.push(stamp_cat['stamps'][i]['stamp_id']);
                       }
					
					global.game_stamps[room_id] = {};
                       global.game_stamps[room_id] = global.__stamps;
                       global.__stamps = [];
                   }
               }
           }
       }
   }
	
	var _catalogues = require('../crumbs/catalogue.json');
	var _whitelist = [];
	var witems_count = 0;
	for(var index in _catalogues) {
		var itemId = _catalogues[index]['paper_item_id'];
		
		_whitelist.push(itemId);
		witems_count++;
	}

	var _pins = require('../crumbs/pins.json');
	for(var index in _pins) {
		var pinId = _pins[index]['paper_item_id'];
		var label = _pins[index]['label'];
		var timestamp = _pins[index]['unix'];
		
		global.pins[pinId] = [pinId, label, timestamp];
		global.pinArr.push(pinId);
	}

    var _items = require('../crumbs/paper_items.json');
    for(var index in _items) {
		var itemId = _items[index]['paper_item_id'];
		var prompt = _items[index]['prompt'];
		var cost = _items[index]['cost'];
		var type = _items[index]['type'];
		var whitelisted = false;
		
		if(_whitelist.indexOf(itemId) >= 0) {
			whitelisted = true;
		}
		
		if(_items[index]['is_epf'] !== undefined) {
			global.epfItems[itemId] = [cost, prompt];
		}

		if(type == 10) {
			global.awards[itemId] = [itemId, prompt];
		}

		global.items[itemId] = [cost, prompt, whitelisted, type];
		
		delete _items[index];
    }

    var _igloos = require('../crumbs/igloos.json');
    for(var index in _igloos) {
        var iglooId = _igloos[index]['igloo_id'];
        var cost = _igloos[index]['cost'];

        global.igloos[iglooId] = cost;
		
		delete _igloos[index];
    }
	
    var _furniture = require('../crumbs/furniture_items.json');
    for(var index in _furniture) {
        var furnitureId = _furniture[index]['furniture_item_id'];
        var cost = _furniture[index]['cost'];

        global.furniture[furnitureId] = cost;
		
		delete _furniture[index];
    }
	
    var _floors = require('../crumbs/igloo_floors.json');
    for(var index in _floors) {
        var floorId = _floors[index]['igloo_floor_id'];
        var cost = _floors[index]['cost'];

        global.floors[floorId] = cost;
		
		delete _floors[index];
    }
	
    var _puffles = require('../crumbs/puffles.json');
    for(var index in _puffles) {
        var puffleId = _puffles[index]['puffle_id'];
		var puffleItem = '75' + puffleId;
		var cost = _puffles[index]['cost'];
		var maxHealth = _puffles[index]['max_health'];
		var maxHunger = _puffles[index]['max_hunger'];
		var maxRest = _puffles[index]['max_rest'];
		
		global.puffles[puffleId] = [puffleId, puffleItem, cost, maxHealth, maxHunger, maxRest];
		global.puffleItems.push(Number(puffleItem));
		
		delete _puffles[index];
    }
	
    var _postcards = require('../crumbs/postcards.json');
    for(var index in _postcards) {
        var postcardId = _postcards[index]['postcard_id'];

        global.postcards.push(postcardId);
		
		delete _postcards[index];
    }

    var cardAmount = 0;
    var _cards = require('../crumbs/cards.json');
    for(var index in _cards) {
    	cardAmount++;

    	if(cardAmount > 300) break;

        var cardType = _cards[index]['card_id'];
		var cardElement = _cards[index]['element'];
		var cardValue = _cards[index]['value'];
		var cardColour = _cards[index]['color'];
		var cardPowerId = _cards[index]['power_id'];
		var cardDetails = [index, cardType, cardElement, cardValue, cardColour, cardPowerId];

		global.cardsObject.push({
			id: cardType, 
			genericIndex: index, 
			element: cardElement, 
			value: cardValue, 
			colour: cardColour, 
			power: cardPowerId,
			details: cardDetails.join('|')
		});
		global.cardsArray.push(cardDetails.join('|'));
		global.cardsById[cardType] = cardDetails.join('|');
		global.cards[index] = cardDetails;
		
		delete _cards[index];
    }

    for(var type in xt_handlers) {
        for(var handler in xt_handlers[type]) {
            try {
            	if(xt_handlers[type][handler].enabled == false) continue;
                event_emitter.addListener(handler, global[xt_handlers[type][handler].event]);
                events_array.push(handler);
            } catch(error) {
                logger.log('function ' + xt_handlers[type][handler].event + '() for ' + handler + ' does not exist.', 'red');
            }
        }
    }

	serverDate = new Date();
	serverDate.setHours(serverDate.getHours() - 7);

	var listeners = events_array.length;
	var rooms_count = Object.keys(global.rooms).length;
	var items_count = Object.keys(global.items).length;
	var igloos_count = Object.keys(global.igloos).length;
	var furniture_count = Object.keys(global.furniture).length;
	var floor_count = Object.keys(global.floors).length;
	var puffle_count = Object.keys(global.puffles).length;
	var postcard_count = Object.keys(global.postcards).length;
	var stamps_count = Object.keys(global.game_stamps).length;
	var cards_count = global.cardsArray.length;

	logger.log('World::{0} XT Listener(s)'.format(listeners), 'green', true);

	logger.log('World Server Started\n', 'green');
}

function getServerTime() {
	serverDate = new Date();
	serverDate.setHours(serverDate.getHours() - 7);

	return serverDate;
}

function handle(penguin, data) {
    var data_check = data.toString().replace("\0", "");
    var data_explode = data.split('%');
    var extension = data_explode[1];
    var type = data_explode[2];
    var handler = data_explode[3];
    var internalId = data_explode[4];
    var handleData = data_explode.splice(5);
	
	handleData.pop();

    if(extension !== 'xt') {
        return network.removePenguin(penguin);
    }
	
	if((data_explode || extension || type || handler || internalId) == undefined) {
		return network.removePenguin(penguin);
	}

	if(penguin.identified !== true && penguinsById[penguin.id] == undefined && handler !== 'f#epfgf') {
		return network.removePenguin(penguin);
	}
	
	if(handler in xt_handlers[type] && events_array.indexOf(handler) >= 0) {
		if(penguin.joined == true && penguin.room !== undefined) {
			if(penguin.database !== undefined && xt_handlers[type][handler].interaction == true) {
				if(penguin.kickRequest == 0) {
					penguin.kickRequest = (new Date().getTime() / 1000);
				} else {
					let now = new Date();

					now.setMinutes(now.getMinutes() - 2);

					if((now / 1000) >= penguin.kickRequest) {
						penguin.kickRequest = 0;
						penguin.database.get_column(penguin.id, 'Kicked', function(kicked) {
							if(Number(kicked) !== 0) {
								penguin.database.update_column(penguin.id, 'Kicked', 0);
								penguin.send('e', -1, 5);
								return network.removePenguin(penguin);
							}
						});
					}
				}
			}
			
			if(Number(penguin.room.internal_id) !== Number(internalId) && Number(internalId) !== -1) {
				return logger.log('Incorrect internal ID', 'red');
			}
			
			var now = new Date();
			var timestamp = (now.getTime() / 1000);
			
			if(xt_handlers[type][handler].throttle == true && (handler !== 'zo' && penguin.room.is_game == false)) {
				if(penguin.throttle[handler] == undefined) {
					penguin.throttle[handler] = [0, timestamp];

					logger.log('Throttle::Adding handler ({0}) to {1}'.format(handler, penguin.name()), 'cyan');
				} else {
					penguin.throttle[handler][0]++;
					
					now.setMinutes(now.getMinutes() - 1);

					logger.log('Throttle::[{0}] handler ({1}) count: {2}'.format(penguin.name(), handler, penguin.throttle[handler][0]), 'cyan');
					
					if(Math.round(now.getTime() / 1000) < Math.round(penguin.throttle[handler][1])) {
						logger.log('Throttle::Checking handler ({0}) from {1}'.format(handler, penguin.name()), 'cyan');

						if(penguin.throttle[handler][0] >= 150) {
							logger.log('Detected threat from ' + penguin.name() + ', removing player.', 'red');
							penguin.send('e', -1, 800);
							return network.removePenguin(penguin);
						}
						
						if(penguin.throttle[handler][0] >= 100) {
							return logger.log('Detected threat from ' + penguin.name() + ', throttling.', 'red');
						}
					} else {
						logger.log('Throttle::Removing handler ({0}) from {1}'.format(handler, penguin.name()), 'cyan');

						delete penguin.throttle[handler];
					}
					
					if(penguin.throttle[handler] !== undefined) {
						logger.log('Throttle::Updating timestamp ({0}) from {1}'.format(handler, penguin.name()), 'cyan');

						penguin.throttle[handler][1] = timestamp;
					}
				}
			}
		}

		try {
			event_emitter.emit(handler, penguin, handleData, data_explode);
		} catch(error) {
			logger.log(error, 'red');
			return network.removePenguin(penguin);
		}
	} else {
		logger.log('undefined XT packet > ' + handler, 'red');
	}
}

global.getServerTime = getServerTime;

module.exports.start = start;
module.exports.handle = handle;
module.exports.getServerTime = getServerTime;