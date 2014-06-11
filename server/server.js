require('./db');

// Datenbank-Objekt erstellen
var mongoose = require('mongoose');

// Mongoose-Models laden.
var SmallData		= mongoose.model('smallData');
var BigData			= mongoose.model('bigData');
var StructureDataOO	= mongoose.model('structureDataOO');
var StructureData1	= mongoose.model('structureData1');
var StructureData2	= mongoose.model('structureData2');
var StructureData3	= mongoose.model('structureData3');
var StructureData13	= mongoose.model('zStructureData13');

// Port auf dem socket.io lauschen soll.
var PORT = 3700;


// socket.io-Objekt erstellen
var io = require('socket.io').listen(PORT);

/**
 * BEGIN Helper Funktionen
 */
/**
 * Die Funktion syncDownAll ermittelt alle Elemente
 * des übergebenen Datentyps.
 * 
 * @param socket
 * @param obj
 * @param typ
 * @param data
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

/**
 * Die Funktion syncDownNewer ermittelt alle Elemente
 * des übergebenen Datentyps, die neuer als der übergebene
 * Zeitpunkt sind.
 * 
 * @param socket
 * @param obj
 * @param typ
 * @param data
 */
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

/**
 * Die Funktion handleClientData verarbeitet die vom Client
 * gesendeten Daten.
 * 
 * @param socket
 * @param data
 * @param obj
 * @param typ
 */
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
	if (typ == 'structureData1' && data.structureData1.length > 0) {
		console.log('handle structureData1');
		for (var i = 0; i < data.structureData1.length; i++) {
			handleClientDataSingle(socket, data.structureData1[i], StructureData1, typ);
		}
	}
	if (typ == 'structureData2' && data.structureData2.length > 0) {
		console.log('handle structureData2');
		for (var i = 0; i < data.structureData2.length; i++) {
			handleClientDataSingle(socket, data.structureData2[i], StructureData2, typ);
		}
	}
	if (typ == 'structureData3' && data.structureData3.length > 0) {
		console.log('handle structureData3');
		for (var i = 0; i < data.structureData3.length; i++) {
			handleClientDataSingle(socket, data.structureData3[i], StructureData3, typ);
		}
	}
	if (typ == 'zStructureData13' && data.structureData13.length > 0) {
		console.log('handle zStructureData13');
		for (var i = 0; i < data.structureData13.length; i++) {
			handleClientDataSingle(socket, data.structureData13[i], StructureData13, typ);
		}
	}
};

/**
 * Die Funktion handleClientDataSingle verarbeitet einen
 * einzelnen Datensatz, der vom Client übermittelten Daten
 * 
 * @param socket
 * @param data
 * @param obj
 * @param typ
 */
var handleClientDataSingle = function (socket, data, obj, typ) {
	if (data.serverId == null) {
		// neues Objekt anlegen.
		// Sync ok
		var tmp = new obj(data);
		tmp.save(function(err, items) {
			if (err) {
				return console.error(err);
			}
			// Antwort an Sender senden.
			socket.emit('sync-up-single-ok', {
				typ: typ,
				id: data.id,
				serverId: items._id,
			});
			// Broadcast an alle außer Sender.
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
					// socket-Ereignis aussenden, an alle außer Sender.
					socket.broadcast.emit('sync-down-single', {
						typ: typ,
						data: data,
						serverId: items._id,
					});
				});
			}
		});
	}
};
/**
 * END Helper Funktionen
 */

/**
 * BEGIN socket-Events
 */
io.sockets.on('connection', function (socket) {
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
			// structureData1
			syncDownAll(socket, StructureData1, 'structureData1', data);
			// structureData2
			syncDownAll(socket, StructureData2, 'structureData2', data);
			// structureData3
			syncDownAll(socket, StructureData3, 'structureData3', data);
			// structureData13
			syncDownAll(socket, StructureData13, 'zStructureData13', data);
		} else {
			// Es muessen nur Daten, die neuer als lastSync
			// sind uebermittelt werden.
			
			// smallData
			syncDownNewer(socket, SmallData, 'smallData', data);
			// bigData
			syncDownNewer(socket, BigData, 'bigData', data);
			// structureDataOO
			syncDownNewer(socket, StructureDataOO, 'structureDataOO', data);
			// structureData1
			syncDownNewer(socket, StructureData1, 'structureData1', data);
			// structureData2
			syncDownNewer(socket, StructureData2, 'structureData2', data);
			// structureData3
			syncDownNewer(socket, StructureData3, 'structureData3', data);
			// structureData13
			syncDownNewer(socket, StructureData13, 'zStructureData13', data);
		}
	});
	
	socket.on('sync-up-single', function (data) {
		var obj;
		if (data.typ == 'smallData') {
			obj = new SmallData(data.data);
		} else if (data.typ == 'bigData') {
			obj = new BigData(data.data);
		} else if (data.typ == 'structureDataOO') {
			obj = new StructureDataOO(data.data);
		} else if (data.typ == 'structureData1') {
			obj = new StructureData1(data.data);
		} else if (data.typ == 'structureData2') {
			obj = new StructureData2(data.data);
		} else if (data.typ == 'structureData3') {
			obj = new StructureData3(data.data);
		} else if (data.typ == 'zStructureData13') {
			obj = new StructureData13(data.data);
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
});
/**
 * END socket-Events
 */