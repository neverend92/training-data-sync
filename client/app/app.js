/**
 * BEGIN Config-Datei laden.
 */
// Settings-Objekt, das bei erfolgreichem Laden bef�hlt wird.
var settings;
$.ajax({
	// Ort der Config-Datei.
	url: 'app/config/config.json',
	// Kein asynchroner Ajax-Call, damit Settings-Objekt verf�gbar ist
	// wenn Anwendung gestartet wird.
	async: false,
	// Daten-Typ der Config-Datei.
	dataType: 'json',
	// Aktion bei erfolgreichem Laden.
	success: function (data) {
		// Setzen der globalen settings-Variable mit empfangenen Daten.
		settings = data;
	}
});
// DEBUG-Log auf Konsole.
console.log('DEBUG: Log <settings>-Object: ' , settings);
/**
 * END Config-Datei laden.
 */

// Initialisiere Ember Application
App = Ember.Application.create({
	//LOG_TRANSITIONS: true
});

/**
 * BEGIN Verbindung zum Socket
 */
// Array mit HTML-Code f�r den jeweiligen Verbindungs-Status
var socketStatus = {
	'online': '<span style="color: #5cb85c;"><i class="glyphicon glyphicon-ok-circle"></i> Online</span>',
	'offline': '<span style="color: #d9534f;"><i class="glyphicon glyphicon-remove-circle"></i> Offline</span>',
	'connect': '<span style="color: #f0ad4e;"><i class="glyphicon glyphicon-refresh"></i> Verbinde...</span>'
};

// IP des Servers aus Einstellungen
var socketIP = settings.server.ip;

// Port des Servers aus Einstellung
var socketPort = settings.server.port;

// Pr�fen der abgerufenen Einstellungen
// IP und Port d�rfen nicht leer sein.
if (socketIP == undefined || socketPort == undefined) {
	/**
	 * @TODO: Fehlermeldung durch Fallback ersetzen.
	 */
	alert('Error Loading Settings');
	console.log('Error Loading Settings');
}

// Verbindung zum Websocket aufbauen
// socket-Objekt erhalten.
var socket = io.connect('http://' + socketIP + ':' + socketPort);

// Binding f�r den Verbindungsaufbau zum Socket
socket.on('connecting', function () {
	$('#socketStatus').html(socketStatus.connect);
	console.log('Verbindung zum Server wird aufgebaut...');
});

// Binding f�r die abgeschlossene Verbindungsherstellung
socket.on('connect', function () {
	$('#socketStatus').html(socketStatus.online);
	console.log('Verbindung zum Server hergestellt.');
	
	socket.emit('sync-down', {
		msg: 'Sync-Down-Request'
	});
});

// Binding f�r die Verbindungstrennung
socket.on('disconnect', function () {
	$('#socketStatus').html(socketStatus.offline);
	console.log('Verbindung zum Server getrennt.');
});

socket.on('sync-down', function (data) {
	console.log(data);
});
socket.on('sync-down-single', function (data) {
	console.log(data);
});
/**
 * END Verbindung zum Socket
 */

/**
 * BEGIN Ember Router
 */
App.Router.map(function () {
	this.resource('smallDatas');
});
/**
 * END Ember Router
 */

/**
 * BEGIN Ember Route
 */
App.SmallDatasRoute = Ember.Route.extend({
	model: function () {
		
	}
});
/**
 * END Ember Route
 */
