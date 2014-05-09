/**
 * BEGIN Config-Datei laden.
 */
// Settings-Objekt, das bei erfolgreichem Laden befühlt wird.
var settings;
$.ajax({
	// Ort der Config-Datei.
	url: 'app/config/config.json',
	// Kein asynchroner Ajax-Call, damit Settings-Objekt verfügbar ist
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

/**
 * BEGIN Status der App laden.
 */
/*var lastSync = localStorage.get('last-sync');
if (lastSync == undefined) {
	localStorage.set('last-sync', null);
}*/
/**
 * END Status der App laden.
 */

// Initialisiere Ember Application
App = Ember.Application.create({
	//LOG_TRANSITIONS: true
});

/**
 * BEGIN Verbindung zum Socket
 */
// Array mit HTML-Code für den jeweiligen Verbindungs-Status
var socketStatus = {
	'online': '<span style="color: #5cb85c;"><i class="glyphicon glyphicon-ok-circle"></i> Online</span>',
	'offline': '<span style="color: #d9534f;"><i class="glyphicon glyphicon-remove-circle"></i> Offline</span>',
	'connect': '<span style="color: #f0ad4e;"><i class="glyphicon glyphicon-refresh"></i> Verbinde...</span>'
};

// IP des Servers aus Einstellungen
var socketIP = settings.server.ip;

// Port des Servers aus Einstellung
var socketPort = settings.server.port;

// Prüfen der abgerufenen Einstellungen
// IP und Port dürfen nicht leer sein.
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

// Binding für den Verbindungsaufbau zum Socket
socket.on('connecting', function () {
	$('#socketStatus').html(socketStatus.connect);
	console.log('Verbindung zum Server wird aufgebaut...');
});

// Binding für die abgeschlossene Verbindungsherstellung
socket.on('connect', function () {
	$('#socketStatus').html(socketStatus.online);
	console.log('Verbindung zum Server hergestellt.');
	
	socket.emit('sync-down', {
		lastSync: localStorage.getItem('last-sync')
	});
});

// Binding für die Verbindungstrennung
socket.on('disconnect', function () {
	$('#socketStatus').html(socketStatus.offline);
	console.log('Verbindung zum Server getrennt.');
});

socket.on('sync-down-ok', function (data) {
	console.log(data);
});
socket.on('sync-up-single-ok', function (data) {
	App.__container__.lookup('controller:' + data.typ + 's').send('syncOne', data);
});
socket.on('sync-down-single', function (data) {
	App.__container__.lookup('controller:' + data.typ + 's').send('syncDownOne', data);
});
/**
 * END Verbindung zum Socket
 */

/**
 * BEGIN Ember Model
 */

App.SmallData = DS.Model.extend({
	serverId: DS.attr('string'),
	content: DS.attr('string'),
	deleted: DS.attr('number'),
	sync: DS.attr('number'),
	createdAt: DS.attr('date'),
	updatedAt: DS.attr('date'),
});
/**
 * END Ember Model
 */

/**
 * BEGIN Ember IndexedDB Apdapter
 */
App.ApplicationSerializer = DS.IndexedDBSerializer.extend();
App.ApplicationAdapter = DS.IndexedDBAdapter.extend({
	databaseName: 'training-data-sync',
	version: 7,
	migrations: function () {
		this.addModel(App.SmallData);
	}
});
/**
 * END Ember IndexedDB Apdapter
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
		return this.store.find('smallData');
	}
});
/**
 * END Ember Route
 */

/**
 * BEGIN Ember Controller
 */
App.SmallDatasController = Ember.ObjectController.extend({
	sortProperties: ['name'],
	sortAscending: true,
	
	smallDatasCount: function () {
		return this.get('model.length');
	}.property('@each'),
	
	actions: {
		syncOne: function (data) {
			var callback = this.store.find(data.typ, data.id);
			callback.then(function (obj) {
				obj.set('serverId', data.serverId);
				obj.set('sync', 1);
			});
			localStorage.setItem('last-sync', new Date());
		},
		syncDownOne: function (data) {
			var callback = this.store.findQuery(data.typ, {
				serverId: data.serverId
			});
			
			if (callback.isFulfilled) {
				callback.then(function (obj) {
					obj.set('content', data.data.content);
					obj.set('deleted', data.data.deleted);
					obj.set('updatedAt', data.data.updatedAt);
					obj.set('sync', 1);
				});
			} else {
				var smallData = this.store.createRecord('smallData', {
					serverId: data.serverId,
					content: data.data.content,
					deleted: data.data.deleted,
					sync: 1,
					createdAt: data.data.createdAt,
					updatedAt: data.data.updatedAt
				});
				smallData.save();
			}
			localStorage.setItem('last-sync', new Date());
		},
		addOne: function () {
			//var t1 = new Date().getTime();
			
			var ts = new Date();
			var content = randomString(10);
			var smallData = this.store.createRecord('smallData', {
				content: content,
				deleted: 0,
				sync: 0,
				createdAt: ts,
				updatedAt: ts
			});
			//console.log(smallData);
			smallData.save();
			
			// Neu erstelltes Objekt an den Server senden.
			socket.emit('sync-up-single', {
				typ: 'smallData',
				id: smallData.get('id'),
				data: {
					content: smallData.get('content'),
					deleted: smallData.get('deleted'),
					createdAt: smallData.get('createdAt'),
					updatedAt: smallData.get('updatedAt'),
				}
			});
			
			//var t2 = new Date().getTime();
			//console.log('addOne: ' + ((t2-t1)/1000) + 's');
		},
		addMultiple: function() {
			var t1 = new Date().getTime();
			for (var i = 0; i < 10000; i++) {
				this.send('addOne');
			}
			var t2 = new Date().getTime();
			console.log('addMultiple: ' + ((t2-t1)/1000) + 's');
		},
		clearStore: function() {
			this.store.clear();
		}
	}
	
});
/**
 * END Ember Controller
 */

/**
 * BEGIN Helper Funktionen
 */
var randomString = function (length) {
	var text = "";
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvwxyz0123456789";
	
	for (var i = 0; i < length; i++) {
		text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	
	return text;
};
/**
 * END Helper Funktionen
 */