var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* Settings - s# */
module.exports = function() {
	this.startDependency = function() {
	}

    this.updatePlayerClothing = function(penguin, data, rawData) {
        var itemId = data[0];
		var clothingType = rawData[3].split('#')[1];
		
		if(clothingType == undefined) {
			return;
		}
		
		switch(clothingType) {
			case 'upc':
				return penguin.updateColour(itemId);
			break;
			case 'uph':
				return penguin.updateHead(itemId);
			break;
			case 'upf':
				return penguin.updateFace(itemId);
			break;
			case 'upn':
				return penguin.updateNeck(itemId);
			break;
			case 'upb':
				return penguin.updateBody(itemId);
			break;
			case 'upa':
				return penguin.updateHand(itemId);
			break;
			case 'upe':
				return penguin.updateFeet(itemId);
			break;
			case 'upp':
				return penguin.updatePhoto(itemId);
			break;
			case 'upl':
				return penguin.updateFlag(itemId);
			break;
		}
    }
}