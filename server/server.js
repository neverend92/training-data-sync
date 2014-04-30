require('./db');
var mongoose = require('mongoose');

var PORT = 3700;

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
		console.log('Habe Objekt von Typ: ' + data.typ + ' erhalten!');
		io.sockets.emit('sync-down-single', {
			typ: data.typ,
			data: data.data
		});
	});
	/**
	 * END Serverdaten an Client senden.
	 */
});