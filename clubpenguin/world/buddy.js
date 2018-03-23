var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var Promise = require("bluebird");

/* Buddies - b# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.addBuddy = function(penguin, buddyId) {
		if(isNaN(buddyId) || penguin.id == Number(buddyId) || penguin.buddyRequests[Number(buddyId)] == undefined) {
			return;
		}
		
		if(penguinsById[buddyId] == undefined) {
			return;
		}
		
		delete penguin.buddyRequests[Number(buddyId)];
		
		var buddy = penguinsById[buddyId];
		
		penguin.buddies.push(buddy.username);
		buddy.buddies.push(penguin.username);
		
		penguin.buddiesById[buddyId] = buddy.username;
		buddy.buddiesById[penguin.id] = penguin.username;
		
		penguin.buddylist[buddyId] = {id: buddyId, nickname: buddy.username, online: 1};
		buddy.buddylist[penguin.id] = {id: penguin.id, nickname: penguin.username, online: 1};
		
		penguin.database.update_column(penguin.id, 'Buddies', penguin.buddies.join(',').replace(/(^[,\s]+)|([,\s]+$)/g, ''));
		penguin.database.update_column(buddy.id, 'Buddies', buddy.buddies.join(',').replace(/(^[,\s]+)|([,\s]+$)/g, ''));
		
		buddy.send('ba', buddy.room.internal_id, penguin.id, penguin.name());
		penguin.send('ba', penguin.room.internal_id, buddy.id, buddy.name());
	}
	
	this.removeOnlineBuddy = function(penguin, buddyId) {
		if(isNaN(buddyId) || penguin.id == Number(buddyId)) {
			return;
		}
		
		var buddy = penguinsById[buddyId];
        var indexPenguin = penguin.buddies.indexOf(buddy.username);
		var indexBuddy = buddy.buddies.indexOf(penguin.username);

        if(indexPenguin == -1 || indexBuddy == -1) {
            return;
        }

        penguin.buddies.splice(indexPenguin, 1);
        buddy.buddies.splice(indexBuddy, 1);
		
		delete penguin.buddiesById[buddyId];
		delete buddy.buddiesById[penguin.id];
		
		delete penguin.buddylist[buddyId];
		delete buddy.buddylist[penguin.id];
		
		penguin.database.update_column(penguin.id, 'Buddies', penguin.buddies.join(','));
		penguin.database.update_column(buddy.id, 'Buddies', buddy.buddies.join(','));
		
		buddy.send('br', buddy.room.internal_id, penguin.id, penguin.name());
	}
	
	this.removeOfflineBuddy = function(penguin, buddyId) {
		if(isNaN(buddyId) || penguin.id == Number(buddyId)) {
			return;
		}

		penguin.database.get_column(buddyId, 'Username', function(username) {
			if(username == undefined) {
				return;
			}

			const _index = penguin.buddies.indexOf(username);

			penguin.buddies.splice(_index, 1);
			penguin.database.update_column(penguin.id, 'Buddies', penguin.buddies.join(','));
		});

		penguin.database.get_column(buddyId, 'Buddies', function(result) {
			const buddies = result.split(',');
			const _index = buddies.indexOf(penguin.username);

			buddies.splice(_index, 1);

			penguin.database.update_column(buddyId, 'Buddies', buddies.join(','));
		});
	}
	
	this.sendBuddyRequest = function(penguin, data) {
		var buddyId = data[0];
		
		if(isNaN(buddyId)) {
			return;
		}
		
		if(penguin.buddyRequests[Number(buddyId)] !== undefined) {
			return;
		}
		
		if(penguin.buddiesById[Number(buddyId)] !== undefined) {
			return;
		}
		
		if(penguinsById[buddyId] !== undefined) {
			var buddy = penguinsById[buddyId];
			
			if(buddy.ignoresById[penguin.id] !== undefined) {
				return;
			}
			
			buddy.buddyRequests[penguin.id] = [penguin.name()];
			buddy.send('br', penguin.room.internal_id, penguin.id, penguin.name());
		}
	}
	
	this.sendBuddyRemove = function(penguin, data) {
		var buddyId = data[0];
		
		if(isNaN(buddyId)) {
			return;
		}
		
		if(penguin.buddiesById[Number(buddyId)] == undefined) {
			return;
		}
		
		if(penguinsById[buddyId] !== undefined) {
			removeOnlineBuddy(penguin, Number(buddyId));
		} else {
			removeOfflineBuddy(penguin, Number(buddyId));
		}
	}
	
	this.acceptBuddy = function(penguin, data) {
		var buddyId = data[0];
		
		if(isNaN(buddyId)) {
			return;
		}
		
		if(penguin.buddiesById[Number(buddyId)] !== undefined) {
			return;
		}
		
		if(penguin.buddies.length >= 200) {
			return penguin.send('e', penguin.room.internal_id, 901);
		}
		
		addBuddy(penguin, Number(buddyId));
	}
	
	this.getBuddies = function(penguin, data) {
		if(penguin.buddies == undefined) {
			penguin.send('gb', -1);
			
			return logger.log('Buddies undefined for ' + penguin.name(), 'red');
		}
		
		if(penguin.buddies.length == 0) {
			return penguin.send('gb', -1);
		}
		
		let buddies = [];
		
		let nameList = penguin.buddies.join("','").trim();
		
		penguin.database.getMyBuddies(nameList, ['ID', 'Nickname', 'approved'], function(rows) {
			Promise.each(rows, (row) => {
				let buddyId = Number(row['ID']);
				let buddyName = String(row['Nickname']);
				let online = 0;
				
				if(Number(row['approved']) == 0) {
					buddyName = 'P' + buddyId;
				}
				
				if(penguinsById[buddyId] !== undefined) {
					online = 1;
				}
				
				let buddyDetails = [buddyId, buddyName, online];
				
				penguin.buddylist[buddyId] = {id: buddyId, nickname: buddyName, online: online};
				penguin.buddiesById[buddyId] = buddyName;
				
				buddies.push(buddyDetails.join('|'));
			}).then(() => {
				penguin.send('gb', -1, buddies.join('%'));

				sendBuddyOnline(penguin);
			});
		});
	}
	
	this.sendBuddyOnline = function(penguin) {
		if(penguin.buddies.length == 0) {
			return;
		}
		
        if(penguin.buddylist == undefined || penguin.buddylist == null) {
            return;
        }

        let buddylistKeys = Object.keys(penguin.buddylist);

        Promise.each(buddylistKeys, (buddyId) => {
        	if(penguinsById[buddyId] !== undefined) {
				penguinsById[buddyId].send('bon', -1, penguin.id);
			}
        });
	}
	
	this.findBuddy = function(penguin, data) {
		var buddyId = data[0];
		
		if(penguin.buddiesById[Number(buddyId)] == undefined) {
			return penguin.send('bf', penguin.room.internal_id, -1); //offline
		}
		
		if(penguinsById[Number(buddyId)] !== undefined) {
			penguin.send('bf', penguin.room.internal_id, penguinsById[buddyId].room.external_id);
		}
	}

	return this;
}
