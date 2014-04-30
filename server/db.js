/**
 * Datenbank-Objekt erstellen
 */
var mongoose = require('mongoose');

mongoose.model('club', new mongoose.Schema({
	id: Number,
	name: String,
	deleted: Number,
	createdAt: Date,
	updatedAt: Date
}));

mongoose.connect('mongodb://localhost/traning-plan-control');