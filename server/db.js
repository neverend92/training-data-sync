// Datenbank-Objekt erstellen
var mongoose = require('mongoose');


//var db = mongoose.connection;

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

mongoose.model('bigData', new mongoose.Schema({
	id: Number,
	content: String,
	blob: String,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));

mongoose.model('structureDataOO', new mongoose.Schema({
	id: Number,
	content: String,
	subObj1: Array,
	subObj2: Array,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));

mongoose.model('structureData1', new mongoose.Schema({
	id: Number,
	content: String,
	subObj1: Number,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));

mongoose.model('structureData2', new mongoose.Schema({
	id: Number,
	content: String,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));

mongoose.model('structureData3', new mongoose.Schema({
	id: Number,
	content: String,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));

mongoose.model('zStructureData13', new mongoose.Schema({
	id: Number,
	content: String,
	obj1: Array,
	subObj3: Array,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));
/**
 * BEGIN benötigte Objekte abbilden
 */

//Verbindung mit Datenbank aufbauen.
//ACHTUNG dafür muss der MongoDB-Server gestartet werden!!!
mongoose.connect('mongodb://localhost/training-data-sync');