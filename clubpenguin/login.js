var network = require('../util/network.js');
var logger = require('../util/logger.js');
var crypto = require('../util/crypto.js');
var et = require('elementtree');
var events = require('events');
var event_emitter = new events.EventEmitter();
var bcrypt = require('bcrypt-nodejs');
var Promise = require("bluebird");

xml_handlers = {
    'verChk': 'handle_version',
    'rndK': 'handle_random',
	'authentication': 'handle_auth',
    'login': 'handle_login'
}

xmlListeners = [];

loginAttempts = {};
loginTimestamps = {};
loginThrottle = {};

MAX_LOGIN_ATTEMPTS = 7;

function start(showLog) {
    for(var handler in xml_handlers) {
        try {
            event_emitter.addListener(handler, this[xml_handlers[handler]]);
            xmlListeners.push(handler);
        } catch(error) {
            logger.log('function ' + xml_handlers[handler] + '() for ' + handler + ' does not exist.', 'red');
        }
    }

    var listeners = xmlListeners.length;

    logger.log('Login::{0} XML Listener(s)'.format(listeners), 'green');
	logger.log('Login Server Started\n', 'green');
}

function handle(penguin, data) {
    var data_check = data.toString().replace("\0", "");

    if(data_check == '<policy-file-request/>') {
        return handle_policy(penguin);
    }
	
	try {
		var xml_obj = et.parse(data_check);
		var body = xml_obj['_root']['_children'][0];
		var action = body['attrib']['action'].toString();
	} catch(error) {
		logger.log('Incorrect XML packet recieved: ' + data, 'red');
		
		return network.removePenguin(penguin);
	}

    if(action in xml_handlers) {
    	let now = new Date();
		let timestamp = Math.round(now.getTime() / 1000);

		if(loginThrottle[penguin.ipAddress] == undefined) {
			loginThrottle[penguin.ipAddress] = {};
		}

    	if(loginThrottle[penguin.ipAddress][action] == undefined) {
    		logger.log('Adding ' + action + ' to login throttle.', 'cyan');

			loginThrottle[penguin.ipAddress][action] = [0, timestamp];
		} else {
			loginThrottle[penguin.ipAddress][action][0]++;

			logger.log('Login throttle count (' + action + '/' + penguin.ipAddress + '): ' + loginThrottle[penguin.ipAddress][action][0], 'cyan');
					
			now.setMinutes(now.getMinutes() - 1);
					
			if(Math.round(now.getTime() / 1000) < Math.round(loginThrottle[penguin.ipAddress][action][1])) {
				if(loginThrottle[penguin.ipAddress][action][0] >= 100) {
					logger.log('Detected threat from ' + penguin.name() + ', removing player.', 'red');
					return network.removePenguin(penguin);
				}
			} else {
				delete loginThrottle[penguin.ipAddress][action];
			}
					
			if(loginThrottle[penguin.ipAddress][action] !== undefined) {
				loginThrottle[penguin.ipAddress][action][1] = timestamp;
			}
		}

        let function_string = xml_handlers[action];

        if(typeof function_string == 'string') {
            event_emitter.emit(action, penguin, body);
        }
    } else {
        logger.log('undefined XML packet > ' + action, 'red');
    }
}

function handle_policy(penguin) {
	let port = global.serverSettings.port;

    penguin.send_data('<cross-domain-policy><allow-access-from domain="*.cprewritten.net" to-ports="{0}" /></cross-domain-policy>'.format(port)); //add port to this

    return network.removePenguin(penguin);
}

function handle_version(penguin, xml) {
    if(penguin.stage !== 0) {
        return network.removePenguin(penguin);
    }

    penguin.stage = 1;

    if(xml['_children'][0]['attrib']['v'] == 153) {
        return penguin.send_data('<msg t="sys"><body action="apiOK" r="0"></body></msg>');
    }
	
    return network.removePenguin(penguin);
}

function handle_random(penguin, xml) {
    var random_key = crypto.random_key(9);

    if(penguin.stage !== 1) {
        return network.removePenguin(penguin);
    }

    penguin.stage = 2;

	if(world_type == 'login') {
		penguin.key = 'a94c5ed2140fc249ee3ce0729e19af5a';
	} else {
		penguin.key = random_key;
	}

    penguin.send_data('<msg t="sys"><body action="rndK" r="-1"><k>{0}</k></body></msg>'.format(penguin.key));
}

function calculateWorldPopulation(population, capacity) {	
	if(Number(population) < 10) {
		return 0;
	}
	
	if(Number(population) >= Number(capacity)) {
		return 7;
	}
	
	var bars = 7;
	var capacity = capacity + 100;
	var threshold = Math.round(capacity / bars);
	
	var i = 0;
	while(i < bars) {
		if(population <= (threshold * i)) {
			return i;
		}
		
		i += 1;
	}
	
	return 7;
}

function generateWorldString(worlds, moderator, callback) {
	var worldArray = [];
	
	Promise.each(worlds, (world) => {
		var worldId = world['worldID'];
		var capacity = world['worldCapacity'];
		var population = world['worldPopulation'];
		var barPop = calculateWorldPopulation(population, capacity);
		
		if(barPop >= 6 && Number(moderator) == 1) {
			barPop = 5;
		}
		
		worldArray.push([worldId, barPop].join(','));
	}).then(() => {
		callback(worldArray.join('|'));
	});
}

function getBuddyWorlds(penguin, id, buddies, callback) {
	var buddies = buddies.split(',');
	var buddyWorlds = [];
	var index = 0;
	
	if(buddies.length == 0) {
		return callback('');
	}
	
	Promise.each(buddies, (buddy) => {
		index++;
		
		penguin.database.getBuddyWorldData(buddy, index, function(success, worldId, index) {
			if(success) {
				buddyWorlds.push(worldId);
			}
						
			if(buddies.length == index) {
				return callback(buddyWorlds.join('|'));
			}
		});
	});
}

function handle_auth(penguin) {
	penguin.authPassed = true;
	penguin.send('auth', -1, 'success');
}

function handle_login(penguin, xml) {
	if(penguin.authPassed == false && world_type == 'login') {
		return network.removePenguin(penguin);
	}

	var zone = xml['_children'][0]['attrib']['z'];
	var nick = xml['_children'][0]['_children'][0]['text'];
	var passwd = xml['_children'][0]['_children'][1]['text'];
	
	var world_type = global.world_type;
	
	logger.log('Verifying ' + nick.toUpperCase(), 'cyan');

	if(penguin.stage !== 2 || zone !== 'w1') {
		return network.removePenguin(penguin);
	}
	
	if(world_type == 'game' || world_type == 'redemption') {
		return handle_world(penguin, nick, passwd);
	}

	if(loginAttempts[penguin.ipAddress] !== undefined) {
		if(loginAttempts[penguin.ipAddress].length >= MAX_LOGIN_ATTEMPTS) {
			let currentDate = Math.floor(new Date().getTime() / 1000);

			if(currentDate < loginTimestamps[penguin.ipAddress]) {
				penguin.send('e', -1, 150);
				return network.removePenguin(penguin);
			} else {
				delete loginAttempts[penguin.ipAddress];
				delete loginTimestamps[penguin.ipAddress];
			}
		}
	}
	
	penguin.database.player_exists(nick, function(result) {
		if(!result) {
			penguin.send('e', -1, 100);
			return network.removePenguin(penguin);
		}
		
		penguin.database.get_columns_name(nick, ['ID', 'Password', 'Banned', 'Buddies', 'Moderator', 'active', 'LoginIPs'], function(row) {
			verifyPenguin(penguin, nick, passwd, row);
		});
	});
}

function addFailedLoginAttempt(penguin) {
	if(loginAttempts[penguin.ipAddress] == undefined) {
		loginAttempts[penguin.ipAddress] = [];
	}

	let logTime = new Date();

	logTime.setHours(logTime.getHours() + 1);

	let timestamp = Math.floor(logTime.getTime() / 1000);

	loginAttempts[penguin.ipAddress].push(timestamp);

	if(loginAttempts[penguin.ipAddress].length == 5) {
		logger.log('[BA]: Locking IP "' + penguin.ipAddress + '" for 1 hour.', 'yellow');

		loginTimestamps[penguin.ipAddress] = timestamp;
	}
}

function verifyPenguin(penguin, nick, passwd, row) {
	var id = row['ID'];
	var password = row['Password'];
	var banned = row['Banned'];
	var buddies = row['Buddies'];
	var moderator = row['Moderator'];
	var active = row['active'];
	var loginIPs = row['LoginIPs'];

	if(global.serverSettings.moderator && !moderator) {
		logger.log('Non-moderator account trying to login to moderator server.', 'red');

		WebhookEvent.emit('staff-log', {
			'Type': 'Non-moderator account trying to login to moderator server.',
			'Player': id + ':' + nick,
			'Server': global.serverSettings.name,
			'Action': 'Removed from network',
			'Edit Player': 'https://team.cprewritten.net/edit_player.php?playerId=' + id
		});

		return network.removePenguin(penguin);
	}
	
	db_password = password.split('');
	db_password[2] = 'a';
	db_password = db_password.join('');
	
	bcrypt.compare(passwd, db_password, function(err, result) {
		if(!result) {
			penguin.send('e', -1, 101);

			addFailedLoginAttempt(penguin);

			return network.removePenguin(penguin);
		}

		delete loginAttempts[penguin.ipAddress];
		delete loginTimestamps[penguin.ipAddress];
		
		finishLogin(penguin, id, banned, buddies, moderator, active, loginIPs);
	});
}

function finishLogin(penguin, id, banned, buddies, moderator, active, loginIPs) {
	//var login_key = crypto.login_key(penguin.key);
	let login_key = crypto.random_key(30);
	
	if(Number(active) == 0) {
		penguin.send('e', -1, 900);
		
		return network.removePenguin(penguin);
	}
	
	if(banned !== '0') {
		if(banned == 'perm') {
			penguin.send('e', -1, 603);
			
			return network.removePenguin(penguin);
		}
	
		if(isNaN(banned)) {
			return network.removePenguin(penguin);
		}
	
		var banned_date = new Date(banned * 1000);
		var now_date = new Date();
	
		if(banned_date > now_date) {
			var hours = Math.floor((banned_date - now_date.getTime()) / 3.6e+6) + 1;
	
			penguin.send('e', -1, 601, hours);

			return network.removePenguin(penguin);
		}
	}
	
	penguin.database.update_column(id, 'LoginKey', login_key);
	penguin.key = '';

	let loginDate = new Date().getTime() / 1000;

	penguin.database.update_column(id, 'LastLogin', loginDate);

	let ipArray = loginIPs.split(',');

	ipArray.push(penguin.ipAddress);
	ipArray = ipArray.filter((e, p) => ipArray.indexOf(e) == p);
	ipArray = ipArray.join(',').replace(/(^[,\s]+)|([,\s]+$)/g, '');

	penguin.database.update_column(id, 'LoginIPs', ipArray);

	penguin.database.getWorldData(function(data) {
		generateWorldString(data, moderator, function(worldString) {
			getBuddyWorlds(penguin, id, buddies, function(buddyWorlds) {
				penguin.send('gs', -1, worldString);
				penguin.send('l', -1, id, login_key, buddyWorlds, worldString);
	
				return network.removePenguin(penguin);
			});
		});
	});
}

function handle_world(penguin, nick, passwd) {
	var login_key = passwd;
	
	penguin.database.player_exists(nick, function(result) {
		if(!result) {
			penguin.send('e', -1, 100);
			return network.removePenguin(penguin);
		}
	
		if(login_key == '') {
			return network.removePenguin(penguin);
		}
	
		penguin.database.get_columns_name(nick, ['LoginKey', 'ID', 'Username', 'Moderator', 'LoginIPs'], function(row) {
			let id = row['ID'];
			let username = row['Username'];
			let moderator = row['Moderator'];
			let db_password = row['LoginKey'];
			let world_hash = crypto.world_key(db_password + penguin.key) + db_password;
			let loginIps = row['LoginIPs'].split(',');
			let lastIp = loginIps[loginIps.length - 1];

			if(loginIps.indexOf(penguin.ipAddress) == -1) { //trying to compromise acc...
				penguin.send('e', -1, 101);
				return network.removePenguin(penguin);
			}
	
			if(world_hash !== login_key) {
				penguin.send('e', -1, 101);
				return network.removePenguin(penguin);
			}
	
			penguin.id = id;
			penguin.username = username;
			penguin.moderator = moderator;
			penguin.identified = true;
	
			penguin.send('l', -1, 'Club Penguin Rewritten');
		});
	});
}

module.exports.start = start;
module.exports.handle = handle;
module.exports.handle_policy = handle_policy;
module.exports.handle_version = handle_version;
module.exports.handle_random = handle_random;
module.exports.handle_auth = handle_auth;
module.exports.handle_login = handle_login;
