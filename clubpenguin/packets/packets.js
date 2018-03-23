var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var xml_type = require('../login.js');
var xt_type = require('../world.js');

function start(showLog) {
    xml_type.start(showLog);
    xt_type.start(showLog);
}

function decide(socket, penguin, data, type) {
	if(data == null) {
		return;
	}

	if(socket == undefined || socket.destroyed) {
		return;
	}

	is_xml = data.toString().substr(0, 1) == '<';
	is_xt = data.toString().substr(0, 1) == '%';

	if(type == 'login' && is_xt) {
		return network.removePenguin(penguin);
	}

	if(is_xml) {
		return xml_type.handle(penguin, data);
	}

	new XTParser(data, {worldConstruct: xt_type, penguin: penguin});
}

class XTParser {
	constructor(rawPacket, world) {
		this.rawPacket = rawPacket;
		this.splitPacket = this.rawPacket.split('%');
		this.extension = this.splitPacket[1];
		this.type = this.splitPacket[2];
		this.handler = this.splitPacket[3];
		this.internalId = this.splitPacket[4];

		this.isBadPacket = false;

		this.knownTypes = ['s', 'z', 'red'];

		logger.log('XTParser::[{0}]'.format(this.handler), 'cyan');

		this.checkType();

		if(!this.isBadPacket) {
			world.worldConstruct.handle(world.penguin, rawPacket);
		}
	}

	checkType() {
		if(this.extension != 'xt') {
			return this.suspiciousPacket();
		}

		if(this.knownTypes.indexOf(this.type) == -1) {
			return this.suspiciousPacket();
		}
	}

	suspiciousPacket() {
		logger.log('XTParser::Bad Packet [{0}%{1}]'.format(this.type, this.handler), 'red');

		this.isBadPacket = true;
	}
}

module.exports.start = start;
module.exports.decide = decide;
module.exports.XTParser = XTParser;