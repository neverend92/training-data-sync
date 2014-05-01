// Datenbank-Objekt erstellen
var mongoose = require('mongoose');


//var db = mongoose.connection;

// Verbindungsfehler prüfen.
/*db.on('error', console.error('No Database Connection'));
db.once('open', function () {
	mongoose.model('smallData', new mongoose.Schema({
		id: Number,
		content: String,
		deleted: Number,
		createdAt: Date,
		updatedAt: Date
	}));
});*/

/**
 * BEGIN benötigte Objekte abbilden
 */
mongoose.model('smallData', new mongoose.Schema({
	id: Number,
	content: String,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));
/**
 * BEGIN benötigte Objekte abbilden
 */

//Verbindung mit Datenbank aufbauen.
//ACHTUNG dafür muss der Server gestartet werden!!!
mongoose.connect('mongodb://localhost/training-data-sync');