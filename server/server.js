require('./db');

// Datenbank-Objekt erstellen
var mongoose = require('mongoose');

var SmallData		= mongoose.model('smallData');
var BigData			= mongoose.model('bigData');
var StructureDataOO	= mongoose.model('structureDataOO');

// Port auf dem socket.io lauschen soll.
var PORT = 3700;


// socket.io-Objekt erstellen
var io = require('socket.io').listen(PORT);

/**
 * BEGIN Helper Funktionen
 */
var syncDownAll = function (socket, obj, typ) {
	obj.find().exec(function (err, items) {
		if (err) {
			return console.error(err);
		}
		for (var i = 0; i < items.length; i++) {
			socket.emit('sync-down-single', {
				typ: typ,
				data: items[i],
				serverId: items[i]._id
			});
		}
	});
};

var syncDownNewer = function (socket, obj, typ, lastSync) {
	obj.find().where('updatedAt').gt(lastSync).exec(function (err, items) {
		if (err) {
			return console.error(err);
		}
		for (var i = 0; i < items.length; i++) {
			socket.emit('sync-down-single', {
				typ: typ,
				data: items[i],
				serverId: items[i]._id
			});
		}
	});
};

var handleClientData = function (data, obj, typ) {
	for (var i = 0; i < data.length; i++) {
		if (data[i].serverId == null) {
			// neues Objekt anlegen.
			// Sync ok
		} else {
			// Element per ServerId ermitteln.
			obj.find().where('serverId').equals(data[i].serverId).exec(function (err, items) {
				if (err) {
					return console.error(err);
				}
				if (items[0].updatedAt >= data[i].updatedAt) {
					// Server-Objekt neuer, dieses wird behalten.
					// Betrifft nur anfragenden Client, da an Server nichts geändert wird.
					socket.emit('sync-down-single', {
						typ: typ,
						data: items[i],
						serverId: items[i]._id
					});
				} else {
					// Client-Objekt neuer, dieses wird behalten.
					// Daten auf Server werden geändert, deshalb ist anschließend
					// Broadcast notwendig.
					obj.update({_id: data[i].serverId}, data[i].data, function (err, items) {
						console.log('updated Server-Element');
						console.log(items[0]);
					});
				}
			});
		}
	}
};
/**
 * END Helper Funktionen
 */


io.sockets.on('connection', function (socket) {
	/**
	 * BEGIN Serverdaten an Client senden.
	 */
	// Anforderung eines Clients, den aktuellen Datenbestand
	// zu erhalten.
	// Dabei ist die Angabe des letzten Sync-Zeitpunkts notwendig.
	socket.on('sync-down', function (data) {
		console.log(data.lastSync);
		if (data.lastSync == null) {
			// Es muessen alle Daten ubermittelt werden.
			
			// smallData
			syncDownAll(socket, SmallData, 'smallData');
			// bigData
			syncDownAll(socket, BigData, 'bigData');
		} else {
			// Es muessen nur Daten, die neuer als lastSync
			// sind uebermittelt werden.
			
			// smallData
			syncDownNewer(socket, SmallData, 'smallData', data.lastSync);
			// bigData
			syncDownNewer(socket, BigData, 'bigData', data.lastSync);
		}
		
		// Daten von Client verarbeiten.
		if (data.smallData.length > 0) {
			handleClientData(data.smallData, SmallData, 'smallData');
		}
		if (data.bigData.length > 0) {
			handleClientData(data.bigData, BigData, 'bigData');
		}
		if (data.structureDataOO.length > 0) {
			handleClientData(data.structureDataOO, StructureDataOO, 'structureDataOO');
		}
	});
	
	socket.on('sync-up', function (data) {
		console.log(data);
	});
	
	socket.on('sync-up-single', function (data) {
		var obj;
		if (data.typ == 'smallData') {
			obj = new SmallData(data.data);
		} else if(data.typ == 'bigData') {
			obj = new BigData(data.data);
		} else if(data.typ == 'structureDataOO') {
			obj = new StructureDataOO(data.data);
		} else {
			return console.error('Unknown Object Typ');
		}
		
		obj.save(function(err, obj) {
			if (err) {
				return console.error(err);
			}
			socket.emit('sync-up-single-ok', {
				typ: data.typ,
				id: data.id,
				serverId: obj._id,
			});
			socket.broadcast.emit('sync-down-single', {
				typ: data.typ,
				data: data.data,
				serverId: obj._id,
			});
		});
	});
	/**
	 * END Serverdaten an Client senden.
	 */
});