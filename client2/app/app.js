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
};
/**
 * END Helper Funktionen
 */

/**
 * BEGIN Status der App laden.
 */
$('#mainHeader').hide();
$('#mainContent').hide();

var randomBlob = randomBlob();
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
	version: 3,
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
		},
		zStructureData13: {
			key: { keyPath: 'id', autoIncrement: true }
		},
		structureDataOO: {
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
		if (typ == 'smallData') {
			data = {
				content: items[0].content,
				deleted: items[0].deleted,
				createdAt: items[0].createdAt,
				updatedAt: items[0].updatedAt,
			};
		} else if (typ == 'bigData') {
			data = {
				content: items[0].content,
				blob: items[0].blob,
				deleted: items[0].deleted,
				createdAt: items[0].createdAt,
				updatedAt: items[0].updatedAt,
			};
		} else if (typ == 'structureDataOO') {
			data = {
				content: items[0].content,
				subObj1: items[0].subObj1,
				subObj2: items[0].subObj2,
				deleted: items[0].deleted,
				createdAt: items[0].createdAt,
				updatedAt: items[0].updatedAt,
			};
		}
		
		socket.emit('sync-up-single', {
			typ: typ,
			id: items[0].id,
			data: data
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
 * Fügt ein Element zur IndexedDB hinzu.
 * 
 * Diese Funktion ist speziell für den Datentyp "structureData",
 * da dieser verzeweigt ist und in einem Schritt mehrere Objekt-Stores
 * befüllt werden müssen.
 * 
 * Die Daten für das neue Objekt werden jeweils in der Variable
 * "data1", "data2" bzw. "data3" übergeben und auch so direkt in der 
 * Datenbank abgelegt.
 * Die Variablen "i" und "n" sind nur bei mehrfachem Aufruf der
 * Funktion von Bedeutung und erkennen, wann der letzte Aufruf erfolgt.
 * Hierdurch ist es möglich die Zeit für bspw. 100 Einfügungen zu messen.
 * 
 * @param Array data1
 * @param Array data2
 * @param Array data3
 * @param Integer i
 * @param Integer n
 */
var dbAdd2 = function (data1, data2, data3, data13, i, n) {
	// Zunächst "structureData2" anlegen.
	server.add('structureData2', data2).done(function (items2) {
		console.log('Item (structureData2) stored with ID: ' + items2[0].id + '.');
		// Erhaltene ID von "structureData1" im "structureData1"-Objekt
		// ablegen.
		data1.subObj1 = items2[0].id;
		
		// "structureData1" anlegen.
		server.add('structureData1', data1).done(function (items1) {
			console.log('Item (structureData1) stored with ID: ' + items1[0].id + '.');
			
			// "structureData3" anlegen.
			server.add('structureData3', data3).done(function (items3) {
				console.log('Item (structureData3) stored with ID: ' + items3[0].id + '.');
				// Zwischengespeicherte ID von "structureData1" im 
				// "structureData13"-Objekt ablegen. 
				data13.obj1 = data1.id;
				// Erhaltene ID von "structureData3" im 
				// "structureData13"-Objekt ablegen. 
				data13.subObj3 = items3[0].id;
				
				// "structureData13" anlegen.
				server.add('zStructureData13', data13).done(function (items13) {
					console.log('Item (zStructureData13) stored with ID: ' + items13[0].id + '.');
					// Wenn letzter Aufruf erreicht und abgeschlossen,
					// benötigte Zeit auf Konsole ausgeben und
					// Ansicht über "dbFindAll" aktualisieren.
					//if (i == (n-1) && n != 1) {
					if (i == (n-1)) {
						console.timeEnd('dbAdd');
						dbFindAll('structureData1');
					}
					// Wenn nur 1 Einfügung stattgefunden hat,
					// ebenfalls Ansicht über "dbFindAll" aktualisieren.
					if (n == 1) {
						dbFindAll('structureData1');
					}
				});
			});
		});
	});
};

/**
 * Löscht ein Element persistent aus der Datenbank.
 * 
 * Der Datentyp wird über die Variable "typ" übergeben,
 * sodass erkennbar ist, in welcher Tabelle das Objekt
 * gelöscht werden soll.
 * Die Variable "id" gibt dabei die ID des zu löschenden
 * Objekts an.
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
 * Der Datentyp wird über die Variable "typ" übergeben,
 * sodass erkennbar ist, in welcher Tabelle das Objekt
 * gelöscht werden soll.
 * Die Variable "id" gibt dabei die ID des zu löschenden
 * Objekts an.
 * Die Variablen "i" und "n" sind nur bei mehrfachem Aufruf der
 * Funktion von Bedeutung und erkennen, wann der letzte Aufruf erfolgt.
 * Hierdurch ist es möglich die Zeit für bspw. 100 Einfügungen zu messen.
 * 
 * @param String typ
 * @param Integer id
 * @param Integer i
 * @param Integer n
 */
var dbDelete = function (typ, id, i, n) {
	server.query(typ).filter('id', id).modify({deleted: 1}).execute().done(function (items) {
		/**
		 * @TODO:
		 * Änderungen an Server senden.
		 */
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
 * Der Datentyp wird über die Variable "typ" übergeben,
 * sodass erkennbar ist, welcher Objekt-Store
 * geleert werden soll.
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
 * Ermittelt alle Elemente eines Objekt-Stores.
 * 
 * Der Datentyp wird über die Variable "typ" übergeben,
 * sodass erkennbar ist, aus welchem Objekt-Store die
 * Daten geladen werden sollen.
 * 
 * @param String typ
 */
var dbFindAll = function (typ) {
	console.time('dbFindAll');
	server.query(typ).filter().execute().done(function (items) {
		$('#mainContent tbody').html('');
		if (items.length == 0) {
			$('#mainContent tbody').html('<tr><td colspan="7"><i>Keine Einträge vorhanden</i></td></tr>');
		}
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
 * Der Datentyp wird über die Variable "typ" übergeben,
 * sodass erkennbar ist, in welchem Objekt-Store alle
 * Elemente mit "deleted" gekennzeichent werden sollen.
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
	alert('Keine Einstellungen gefunden, die Anwendung kann nicht gestartet werden!');
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
	handleClick('smallData', $(this));
});
$('#menuBigData').bind('click', function () {
	handleClick('bigData', $(this));
});
$('#menuStructureData').bind('click', function () {
	handleClick('structureData1', $(this));
});
$('#menuStructureDataOO').bind('click', function () {
	handleClick('structureDataOO', $(this));
});

var handleClick = function (typ, activeLink) {
	$('#sidebar a').removeClass('active');
	activeLink.addClass('active');
	$('#mainContent tbody').html('<tr><td colspan="7">Lade Daten...</td></tr>');
	addListener(typ);
	// Alle Elemente "typ" finden.
	dbFindAll(typ);
};

/**
 * Fügt ein Element des Typs "smallData" hinzu.
 * 
 * @param Integer i
 * @param Integer n
 */
var smallDataAdd = function (i, n) {
	var time = new Date();
	var data = {
		serverId: null,
		content: 'ABCDEFGHI',
		//content: randomString(10),
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time
	};
	
	dbAdd('smallData', data, i, n);
};

/**
 * Fügt ein Element des Typs "bigData" hinzu.
 * 
 * @param Integer i
 * @param Integer n
 */
var bigDataAdd = function (i, n) {
	var time = new Date();
	var blob = randomBlob;
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
};

/**
 * Fügt ein Element des Typs "structureDataOO" hinzu.
 * 
 * @param Integer i
 * @param Integer n
 */
var structureDataOOAdd = function (i, n) {
	var time = new Date();
	
	var subObj1 = {
		id: 1,
		name: 'Test'
	};
	
	var subObj2 = [{
		id: 1,
		name: 'Test'
	}, {
		id: 2,
		name: 'Test2'
	}];
	
	var data = {
		serverId: null,
		content: 'ABCDEFGHI',
		subObj1: subObj1,
		subObj2: subObj2,
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time
	};
	
	dbAdd('structureDataOO', data, i, n);
};

/**
 * Fügt ein Element des Typs "structureData1" hinzu.
 * 
 * @param Integer i
 * @param Integer n
 */
var structureDataAdd = function (i, n) {
	var time = new Date();
	
	var data1 = {
		serverId: null,
		content: 'ABCDEFGHI',
		subObj1: 0,
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time
	};
	
	var data2 = {
		serverId: null,
		content: 'ABCDEFGHI',
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time
	};
	
	var data3 = {
		serverId: null,
		content: 'ABCDEFGHI',
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time	
	};
	
	var data13 = {
		serverId: null,
		obj1: 0,
		subObj3: 0,
		deleted: 0,
		sync: false,
		createdAt: time,
		updatedAt: time	
	};
	
	dbAdd2(data1, data2, data3, data13, i, n);
};

/**
 * Fügt die Listener entsprechend dem aktuell
 * ausgewählten Datentyps in der Navigationsleiste
 * hinzu.
 */
var addListener = function (typ) {
	// Header (Buttons) anzeigen.
	$('#mainHeader').show();
	// Content (Tabelle) anzeigen.
	$('#mainContent').show();
	// Überschrift setzen -> aktuell ausgewählter Datentyp.
	$('#emptyInfoText').html(typ);
	
	// Alte Listener entfernen.
	$('#btnClear').unbind();
	// "Tabelle leeren"-Button Listener hinzufügen.
	$('#btnClear').bind('click', function () {
		dbClear(typ);
	});
	
	// Alte Listener entfernen.
	$('#btnDeleteAll').unbind();
	// "Alle Einträge löschen"-Button Listener hinzufügen.
	$('#btnDeleteAll').bind('click', function () {
		dbFindAndDeleteAll(typ);
	});
	
	// Alte Listener entfernen.
	$('#btnAddOne').unbind();
	// "Eintrag hinzufügen"-Button Listener hinzufügen.
	$('#btnAddOne').bind('click', function () {
		if (typ == 'smallData')	{
			smallDataAdd(1, 1);
		} else if (typ == 'bigData') {
			bigDataAdd(1, 1);
		} else if (typ == 'structureDataOO') {
			structureDataOOAdd(1, 1);
		} else if (typ == 'structureData1') {
			structureDataAdd(1, 1);
		}
	});
	
	// Alte Listener entfernen.
	$('#btnAddMultiple').unbind();
	// "Mehrere Einträge"-Button Listener hinzufügen.
	$('#btnAddMultiple').bind('click', function () {
		console.time('dbAdd');
		
		if (typ == 'smallData')	{
			for (var i = 0; i < 1000; i++) {
				smallDataAdd(i, 1000);
			}
		} else if (typ == 'bigData') {
			for (var i = 0; i < 10; i++) {
				console.log('bigData: ' + i);
				bigDataAdd(i, 10);
			}
		} else if (typ == 'structureDataOO') {
			for (var i = 0; i < 1000; i++) {
				structureDataOOAdd(i, 1000);
			}
		} else if (typ == 'structureData1') {
			for (var i = 0; i < 1000; i++) {
				structureDataAdd(i, 1000);
			}
		}
	});
};
/**
 * END EventListener
 */

/*App.SmallDatasController = Ember.ObjectController.extend({
	
	
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
	}
	
});*/