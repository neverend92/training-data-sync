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
		socket.emit('sync-down', {
			msg: 'Sync-Down startet!'
		});
	});
	
	socket.on('sync-up', function (data) {
		console.log(data);
	});
	
	socket.on('sync-down-single', function (data) {
		console.log(data);
	});
	
	socket.on('sync-up-single', function (data) {
		//console.log('Habe Objekt von Typ: ' + data.typ + ' erhalten!');
		/*io.sockets.emit('sync-down-single', {
			typ: data.typ,
			data: data.data
		});*/
		if (data.typ == 'smallData') {
			var obj = new SmallData(data.data);
		} else {
			console.error('Unknown Object Typ');
			obj = null;
		}
		
		obj.save(function(err, obj) {
			if (err) return console.error(err);
			socket.emit('sync-up-single-ok', {
				typ: data.typ,
				id: data.id,
				serverId: obj._id,
			});
		});
	});
	/**
	 * END Serverdaten an Client senden.
	 */
});