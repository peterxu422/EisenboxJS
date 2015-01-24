// onLaunched event fires when user starts the app
chrome.app.runtime.onLaunched.addListener(function() {
	// Opens window for the app of the specified width and height
	chrome.app.window.create('window.html', {
		'bounds': {
			'width': 800,
			'height': 800
		}
	});
});