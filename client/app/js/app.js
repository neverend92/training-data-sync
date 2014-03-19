App = Ember.Application.create();

App.Router.map(function () {
	this.resource('settings', function () {
		this.resource('setting', { path: ':path'});
	});
	this.resource('workouts');
});

App.SettingsIndexRoute = Ember.Route.extend({
	beforeModel: function () {
		this.transitionTo('setting', 'general');
	}
});

App.WorkoutsRoute = Ember.Route.extend({
	model: function () {
		
	}
});

App.SettingsRoute = Ember.Route.extend({
	model: function () {
		return settings;
	}
});

App.SettingRoute = Ember.Route.extend({
	model: function (params) {
		return settings.findBy('path', params.path);
	},
	
	actions: {
		saveSettings: function () {
			
		}
	}
});

var settings = [{
	id: '1',
	path: 'general',
	name: 'Allgemein',
	text: 'Allgemeine Einstellungen',
	content: [{
		key: 'ip',
		name: 'IP',
		text: 'IP-Adresse des Servers',
		value: '127.0.0.1'
	}, {
		key: 'port',
		name: 'Port',
		text: 'Port des Servers',
		value: '2336'
	}]
}];