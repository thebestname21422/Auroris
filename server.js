var cluster = require('./util/cluster.js');
var logger = require('./util/logger.js');
var error_handler = require('./util/error_handler.js');
var network = require('./util/network.js');
var database = require('./clubpenguin/database/database_manager.js');
var packets = require('./clubpenguin/packets/packets.js');
let parameters = process.argv;

require('./util/utility.js')();

if(parameters.length < 3) {
	return console.log("No server settings input!");
}

var server = parameters[2];

let settings = require('./configurations/worlds.json')[server];

global.world_id = settings.id;
global.serverSettings = settings;
global.serverSettings.name = server;
global.worldType = global.serverSettings.type;

logger.start();
database.start_connection();
packets.start(true);
error_handler.start(true);

network.start(settings.address, settings.port, settings.type, settings.capacity, settings.id);