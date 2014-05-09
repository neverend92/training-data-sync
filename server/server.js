require('./db');

// Datenbank-Objekt erstellen
var mongoose = require('mongoose');

var SmallData = mongoose.model('smallData');

// Port auf dem socket.io lauschen soll.
var PORT = 3700;


// socket.io-Objekt erstellen
var io = require('socket.io').listen(PORT);


io.sockets.on('connection', function (socket) {
	/**
	 * BEGIN Serverdaten an Client senden.
	 */
	// Anforderung eines Clients, den aktuellen Datenbestand
	// zu erhalten.
	// Dabei ist die Angabe des letzten Sync-Zeitpunkts notwendig.
	socket.on('sync-down', function (data) {
		console.log(data);
		if (data.lastSync == null) {
			// Es muessen alle Daten ubermittelt werden.
			// smallData
			SmallData.find().exec(function (err, smallDatas) {
				if (err) {
					return console.error(err);
				}
				for (var i = 0; i < smallDatas.length; i++) {
					socket.emit('sync-down-single', {
						typ: 'smallData',
						data: smallDatas[i],
						serverId: smallDatas[i]._id
					});
				}
			});
		} else {
			// Es muessen nur Daten, die neuer als lastSync
			// sind uebermittelt werden.
			/*SmallData.find().where('updatedAt').gt(data.lastSync).exec(function (err, smallDatas) {
				if (err) {
					return console.error(err);
				}
				console.log(smallDatas);
			});*/
		}
	});
	
	socket.on('sync-up', function (data) {
		console.log(data);
	});
	
	socket.on('sync-up-single', function (data) {
		if (data.typ == 'smallData') {
			var obj = new SmallData(data.data);
		} else {
			console.error('Unknown Object Typ');
			obj = null;
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