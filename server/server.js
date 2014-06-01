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
var syncDownAll = function (socket, obj, typ, data) {
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
		handleClientData(socket, data, obj, typ);
	});
};

var syncDownNewer = function (socket, obj, typ, data) {
	obj.find().where('updatedAt').gt(data.lastSync).exec(function (err, items) {
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
		handleClientData(socket, data, obj, typ);
	});
};
 
var handleClientData = function (socket, data, obj, typ) {
	// Daten von Client verarbeiten.
	if (typ == 'smallData' && data.smallData.length > 0) {
		console.log('handle smallData');
		for (var i = 0; i < data.smallData.length; i++) {
			handleClientDataSingle(socket, data.smallData[i], SmallData, typ);
		}
	}
	if (typ == 'bigData' && data.bigData.length > 0) {
		console.log('handle bigData');
		for (var i = 0; i < data.bigData.length; i++) {
			handleClientDataSingle(socket, data.bigData[i], BigData, typ);
		}
	}
	if (typ == 'structureDataOO' && data.structureDataOO.length > 0) {
		console.log('handle structureDataOO');
		for (var i = 0; i < data.structureDataOO.length; i++) {
			handleClientDataSingle(socket, data.structureDataOO[i], StructureDataOO, typ);
		}
	}
};

var handleClientDataSingle = function (socket, data, obj, typ) {
	if (data.serverId == null) {
		// neues Objekt anlegen.
		// Sync ok
		var tmp = new obj(data);
		tmp.save(function(err, items) {
			if (err) {
				return console.error(err);
			}
			socket.emit('sync-up-single-ok', {
				typ: typ,
				id: data.id,
				serverId: items._id,
			});
			socket.broadcast.emit('sync-down-single', {
				typ: typ,
				data: data,
				serverId: items._id,
			});
		});
	} else {
		// Element per ServerId ermitteln.
		obj.find().where('serverId').equals(data.serverId).exec(function (err, items) {
			if (err) {
				return console.error(err);
			}
			if (items[0].updatedAt >= data.updatedAt) {
				// Server-Objekt neuer, dieses wird behalten.
				// Betrifft nur anfragenden Client, da an Server nichts geändert wird.
				socket.emit('sync-down-single', {
					typ: typ,
					data: items[0],
					serverId: items[0]._id
				});
			} else {
				// Client-Objekt neuer, dieses wird behalten.
				// Daten auf Server werden geändert, deshalb ist anschließend
				// Broadcast notwendig.
				obj.update({_id: data.serverId}, data, function (err, items) {
					console.log('updated Server-Element');
					console.log(items[0]);
				});
			}
		});
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
			syncDownAll(socket, SmallData, 'smallData', data);
			// bigData
			syncDownAll(socket, BigData, 'bigData', data);
			// structureDataOO
			syncDownAll(socket, StructureDataOO, 'structureDataOO', data);
		} else {
			// Es muessen nur Daten, die neuer als lastSync
			// sind uebermittelt werden.
			
			// smallData
			syncDownNewer(socket, SmallData, 'smallData', data);
			// bigData
			syncDownNewer(socket, BigData, 'bigData', data);
			// structureDataOO
			syncDownNewer(socket, StructureDataOO, 'structureDataOO', data);
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