App = Ember.Application.create();

App.Router.map(function () {
	this.resource('workouts');
});


App.WorkoutsRoute = Ember.Route.extend({
	model: function () {
		
	}
});
