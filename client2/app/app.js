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

/**
 * BEGIN Datenbank-Verbindung
 */
var server;
db.open({
	server: 'training-data-sync',
	version: 1,
	schema: {
		smallData: {
			key: { keyPath: 'id', autoIncrement: true }
		},
		bigData: {
			key: { keyPath: 'id', autoIncrement: true }
		}
	}
}).done(function (s) {
	server = s;
});

var dbAdd = function (typ, data, i, n) {
	server.add(typ, data).done(function (items) {
		// Neu erstelltes Objekt an den Server senden.
		socket.emit('sync-up-single', {
			typ: 'smallData',
			id: items[0].id,
			data: {
				content: items[0].content,
				deleted: items[0].deleted,
				createdAt: items[0].createdAt,
				updatedAt: items[0].updatedAt,
			}
		});
		
		console.log('Item (' + typ + ') stored with ID: ' + items[0].id + '.');
		if (i == (n-1) && n != 1) {
			console.timeEnd('dbAdd');
		}
		dbFindAll(typ);
	});
};

var dbRemove = function (typ, id) {
	server.remove(typ, id).done(function (key) {
		console.log('Item (' + typ + ') with ID: ' + key + ' removed.');
		dbFindAll(typ);
	});
};

var dbDelete = function (typ, id) {
	server.query(typ).filter('id', id).modify({deleted: 1}).execute().done(function (items) {
		console.log('Item (' + typ + ') with ID: ' + items[0].id + ' deleted.');
		dbFindAll(typ);
	});
};

var dbClear = function (typ) {
	server.clear(typ).done(function () {
		console.log('Table ' + typ + ' cleared.');
		dbFindAll(typ);
	});
};

var dbFindAll = function (typ) {
	console.time('dbFindAll');
	server.query(typ).filter().execute().done(function (items) {
		$('#mainContent tbody').html('');
		$.each(items, function (key, value) {
			$('#mainContent tbody').append('<tr> \
					<td>' + value.id + '</td> \
					<td>' + value.content + '</td> \
					<td>' + value.deleted + '</td> \
					<td>' + value.sync + '</td> \
					<td>' + value.createdAt + '</td> \
					<td>' + value.updatedAt + '</td> \
					<td><a href="#" class="btn btn-danger" onclick="dbDelete(\'' + typ + '\', ' + value.id + ');">L&oumlschen</a></td> \
					</tr> \
			');
		});
		console.log('Anzahl der Eintraege: ' + items.length);
		console.timeEnd('dbFindAll');
	});
};
/**
 * END Datenbank-Verbindung
 */

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
	
	// Element ermitteln, die nicht synchronisiert sind.#
	// Dabei sind ALLE Datentypen zu durchlaufen.
	server.query('smallData').filter('sync', false).execute().done(function (items) {
		console.log(items);
	});
	
	socket.emit('sync-down', {
		lastSync: localStorage.getItem('last-sync')
	});
});

// Binding f�r die Verbindungstrennung
socket.on('disconnect', function () {
	$('#socketStatus').html(socketStatus.offline);
	console.log('Verbindung zum Server getrennt.');
});

socket.on('sync-down-ok', function (data) {
	console.log(data);
});
socket.on('sync-up-single-ok', function (data) {
	server.query(data.typ).filter('id', data.id).modify({serverId: data.serverId, sync: true}).execute().done(function (items) {
		console.log('Item (' + typ + ') with ID: ' + items[0].id + ' synced.');
		localStorage.setItem('last-sync', new Date());
	});
});
socket.on('sync-down-single', function (data) {
	App.__container__.lookup('controller:' + data.typ + 's').send('syncDownOne', data);
});
/**
 * END Verbindung zum Socket
 */

/**
 * BEGIN EventListener
 */
$('#menuSmallData').bind('click', function () {
	$('#sidebar a').removeClass('active');
	$(this).addClass('active');
	// Alle Elemente "smallData" finden.
	dbFindAll('smallData');
});
$('#btnSmallDataAddOne').bind('click', function () {
	smallDataAdd(1, 1);
});

$('#btnSmallDataAddMultiple').bind('click', function () {
	console.time('dbAdd');
	
	var n = 100;
	
	for (var i = 0; i < n; i++) {
		smallDataAdd(i, n);
	}
});

var smallDataAdd = function (i, n) {
	var time = new Date();
	var data = {
		serverId: null,
		content: randomString(10),
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time
	};
	
	dbAdd('smallData', data, i, n);
};

$('#btnSmallDataClear').bind('click', function () {
	dbClear('smallData');
});

$('#menuBigData').bind('click', function () {
	$('#sidebar a').removeClass('active');
	$(this).addClass('active');
	// Alle Elemente "bigData" finden.
	dbFindAll('bigData');
});
/**
 * END EventListener
 */

/**
 * BEGIN Ember Controller
 */
/*App.SmallDatasController = Ember.ObjectController.extend({
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
	
});*/
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