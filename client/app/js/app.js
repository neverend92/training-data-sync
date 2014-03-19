App = Ember.Application.create();

App.Router.map(function () {
	this.resource('settings');
	this.resource('workouts');
});

App.WorkoutsRoute = Ember.Route.extend({
	model: function () {
		
	}
});

App.SettingsRoute = Ember.Route.extend({
	model: function () {
		
	}
});