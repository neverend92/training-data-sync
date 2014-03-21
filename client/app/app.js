// Config-Datei laden.
var settings;
$.ajax({
	url: 'app/config/config.json',
	async: false,
	dataType: 'json',
	success: function (data) {
		settings = data;
	}
});
console.log(settings);
alert(settings.server.ip);

// Initialisiere Ember Application
App = Ember.Application.create();

App.Router.map(function () {
	this.resource('workouts');
});


App.WorkoutsRoute = Ember.Route.extend({
	model: function () {
		
	}
});
