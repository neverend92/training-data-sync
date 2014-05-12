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
$('#mainHeader').hide();
$('#mainContent').hide();
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
// Objekt, das die Verbindung zur IndexedDB ermöglicht.
var server;
// Verbindungsherstellung zur IndexedDB
db.open({
	// Name der anzulegenden Datenbank
	server: 'training-data-sync',
	// Version der Datenbank, muss bei strukturellen Änderungen
	// erhöht werden.
	version: 1,
	// Datenbank-Schema, ist flexibel
	// Lediglich Key und AutoIncrement müssen angegeben werden.
	schema: {
		smallData: {
			key: { keyPath: 'id', autoIncrement: true }
		},
		bigData: {
			key: { keyPath: 'id', autoIncrement: true }
		},
		structureData1: {
			key: { keyPath: 'id', autoIncrement: true }
		},
		structureData2: {
			key: { keyPath: 'id', autoIncrement: true }
		},
		structureData3: {
			key: { keyPath: 'id', autoIncrement: true }
		}
	}
}).done(function (s) {
	// Callback-Funktion erhält Objekt s
	// Dieses wird in globaler Variable "server" gespeichert.
	server = s;
});

/**
 * Fügt ein Element zur IndexedDB hinzu.
 * 
 * Der Datentyp wird über die Variable "typ" übergeben,
 * sodass erkennbar ist, in welcher Tabelle das neue Objekt
 * gespeichert werden soll.
 * Die Daten für das neue Objekt werden in der Variable
 * "data" übergeben und auch so direkt in der Datenbank
 * abgelegt.
 * Die Variablen "i" und "n" sind nur bei mehrfachem Aufruf der
 * Funktion von Bedeutung und erkennen, wann der letzte Aufruf erfolgt.
 * Hierdurch ist es möglich die Zeit für bspw. 100 Einfügungen zu messen.
 * 
 * @param String typ
 * @param Array data
 * @param Integer i
 * @param Integer n
 */
var dbAdd = function (typ, data, i, n) {
	server.add(typ, data).done(function (items) {
		// Neu erstelltes Objekt an den Server senden.
		socket.emit('sync-up-single', {
			typ: typ,
			id: items[0].id,
			data: {
				content: items[0].content,
				blob: items[0].blob,
				deleted: items[0].deleted,
				createdAt: items[0].createdAt,
				updatedAt: items[0].updatedAt,
			}
		});
		
		console.log('Item (' + typ + ') stored with ID: ' + items[0].id + '.');
		// Wenn letzter Aufruf erreicht und abgeschlossen,
		// benötigte Zeit auf Konsole ausgeben und
		// Ansicht über "dbFindAll" aktualisieren.
		if (i == (n-1) && n != 1) {
			console.timeEnd('dbAdd');
			dbFindAll(typ);
		}
		// Wenn nur 1 Einfügung stattgefunden hat,
		// ebenfalls Ansicht über "dbFindAll" aktualisieren.
		if (n == 1) {
			dbFindAll(typ);
		}
	});
};

/**
 * Löscht ein Element persistent aus der Datenbank
 * 
 * @param String typ
 * @param Integer id
 */
var dbRemove = function (typ, id) {
	server.remove(typ, id).done(function (key) {
		console.log('Item (' + typ + ') with ID: ' + key + ' removed.');
		dbFindAll(typ);
	});
};

/**
 * Setzt bei einem Element den Flag "deleted" auf 1.
 * 
 * @param String typ
 * @param Integer id
 * @param Integer i
 * @param Integer n
 */
var dbDelete = function (typ, id, i, n) {
	server.query(typ).filter('id', id).modify({deleted: 1}).execute().done(function (items) {
		console.log('Item (' + typ + ') with ID: ' + items[0].id + ' deleted.');
		if (i == (n-1) && n != 1) {
			console.timeEnd('dbFindAndDeleteAll');
			dbFindAll(typ);
		}
		if (n == 1) {
			dbFindAll(typ);
		}
	});
};

/**
 * Löcht alle Element aus einem Objekt-Store.
 * 
 * @param String typ
 */
var dbClear = function (typ) {
	server.clear(typ).done(function () {
		console.log('Table ' + typ + ' cleared.');
		dbFindAll(typ);
	});
};

/**
 * Ermittelt alle Elemente eines Objekt-Stores
 * 
 * @param String typ
 */
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
					<td>' + value.createdAt.toLocaleString() + '</td> \
					<td>' + value.updatedAt.toLocaleString() + '</td> \
					<td><a href="#" class="btn btn-danger" onclick="dbDelete(\'' + typ + '\', ' + value.id + ', 1, 1);">Löschen</a></td> \
					</tr> \
			');
		});
		console.log('Anzahl der Eintraege: ' + items.length);
		console.timeEnd('dbFindAll');
	});
};

/**
 * Setzt bei allen Elementen des Objekt-Stores den Flag
 * "deleted" auf 1.
 * 
 * @param String typ
 */
var dbFindAndDeleteAll = function (typ) {
	server.query(typ).filter().execute().done(function (items) {
		console.time('dbFindAndDeleteAll');
		var n = items.length;
		var i = 0;
		$.each(items, function (key, value) {
			dbDelete(typ, value.id, i, n);
			i++;
		});
		
	});
};
/**
 * END Datenbank-Verbindung
 */

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
// IP und Port duerfen nicht leer sein.
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

// Binding fuer den Verbindungsaufbau zum Socket
socket.on('connecting', function () {
	$('#socketStatus').html(socketStatus.connect);
	console.log('Verbindung zum Server wird aufgebaut...');
});

// Binding fuer die abgeschlossene Verbindungsherstellung
socket.on('connect', function () {
	$('#socketStatus').html(socketStatus.online);
	console.log('Verbindung zum Server hergestellt.');
	
	// Element ermitteln, die nicht synchronisiert sind.
	// Dabei sind ALLE Datentypen zu durchlaufen.
	server.query('smallData').filter('sync', false).execute().done(function (items) {
		console.log(items);
	});
	
	socket.emit('sync-down', {
		lastSync: localStorage.getItem('last-sync')
	});
});

// Binding fuer die Verbindungstrennung
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
	//App.__container__.lookup('controller:' + data.typ + 's').send('syncDownOne', data);
});
/**
 * END Verbindung zum Socket
 */

/**
 * BEGIN EventListener
 */

// Listener fuer Menu-Punkte
$('#menuSmallData').bind('click', function () {
	$('#sidebar a').removeClass('active');
	$(this).addClass('active');
	addListener('smallData');
	// Alle Elemente "smallData" finden.
	dbFindAll('smallData');
});
$('#menuBigData').bind('click', function () {
	$('#sidebar a').removeClass('active');
	$(this).addClass('active');
	addListener('bigData');
	// Alle Elemente "bigData" finden.
	dbFindAll('bigData');
});

var smallDataAdd = function (i, n) {
	var time = new Date();
	var data = {
		serverId: null,
		content: randomString(10),
		blob: null,
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time
	};
	
	dbAdd('smallData', data, i, n);
};
var bigDataAdd = function (i, n) {
	var time = new Date();
	var blob = randomBlob();
	var size = (blob.length / 1024) / 1024;
	size += ' MB';
	
	var data = {
		serverId: null,
		content: size,
		blob: blob,
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time
	};
	
	dbAdd('bigData', data, i, n);
}


var addListener = function (typ) {
	$('#mainHeader').show();
	$('#mainContent').show();
	$('#emptyInfoText').html(typ);
	
	$('#btnClear').unbind();
	$('#btnClear').bind('click', function () {
		dbClear(typ);
	});
	
	$('#btnDeleteAll').unbind();
	$('#btnDeleteAll').bind('click', function () {
		dbFindAndDeleteAll(typ);
	});
	
	$('#btnAddOne').unbind();
	$('#btnAddOne').bind('click', function () {
		if (typ == 'smallData')	{
			smallDataAdd(1, 1);
		} else if (typ == 'bigData') {
			bigDataAdd(1, 1);
		}
	});
	
	$('#btnAddMultiple').unbind();
	$('#btnAddMultiple').bind('click', function () {
		console.time('dbAdd');
		
		var n = 100;
		
		for (var i = 0; i < n; i++) {
			if (typ == 'smallData')	{
				smallDataAdd(i, n);
			} else if (typ == 'bigData') {
				console.log('bigData: ' + i);
				bigDataAdd(i, n);
			}
		}
	});
};
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

var randomBlob = function () {
	var text = "";
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvwxyz0123456789";
	
	for (var i = 0; i < (1024*1024*5); i++) {
		text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	
	return text; 
}
/**
 * END Helper Funktionen
 */