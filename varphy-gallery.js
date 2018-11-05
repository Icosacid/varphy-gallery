/**
 * JS for Varphy Gallery
 *
 * @author Alexandrix <alex@alexandrix.com>
 * @since 2018-10-24
 */

var switchTimeMS = 30000;// 30 seconds
var descriptions = [];

var LoadScreen = {};
LoadScreen.start = function() {
	this.total = undefined;
	this.nbLoaded = 0;

	// Load all JSONified XML data into descriptions array
	jQuery
		.get("data/descriptions.xml", {})
		.done(function(data) {

			var jDescs = jQuery(data).find('descriptions');

			jDescs.find('description').each(function(index) {
				var titleText = jQuery(this).find('title').text();
				var contentText = jQuery(this).find('content').text();
				var imageSrc = jQuery(this).find('image').text();

				var desc = {
					title: titleText,
					content: contentText,
					image: imageSrc
				};

				descriptions.push(desc);
			});

			LoadScreen.preload();
		});

	this.preload = function() {
		// Now pre-load all pictures
		this.total = descriptions.length;
		jQuery('.loadscreen .toload').html(this.total);

		var imageObjects = [];

		descriptions.forEach(function(el) {
			imageObjects.push(new Image());
		});

		imageObjects.forEach(function(el, i) {
			el.onload = function() {
				setTimeout(LoadScreen.onStepLoad, 1500 * Math.random());
			};
			el.src = descriptions[i].image;
		});
	};
};
LoadScreen.onStepLoad = function() {
	LoadScreen.nbLoaded++;

	// Update DOM
	jQuery('.loadscreen .loaded').html(LoadScreen.nbLoaded);

	// Fade out if loading complete
	if (LoadScreen.nbLoaded == LoadScreen.total) {
		jQuery('.loadscreen .loadingtext').html("Loading complete");
		jQuery('.loadscreen').fadeOut(2000);

		LoadScreen.onComplete();
	}
};
LoadScreen.onComplete = function() {
	// Start all app loops
	Varphyloader.boot();
	GalleryRotate.boot();
	Klok.boot();
};

var Varphyloader = {}; // Particle systems and drawing

Varphyloader.boot = function() {
	this.setup();
	
	// Animate
	Varphyloader.anim = null;
	Varphyloader.frame = function() {
		Varphyloader.update();
		Varphyloader.anim = window.requestAnimationFrame(Varphyloader.frame);
	};
	
	Varphyloader.showFilmLoader = false;
	
	// Press space to increase time, press B to lower time, press F to show film loader
	document.addEventListener('keydown', function(event) {
		if (event.key == ' ') {
			Varphyloader.nextTime += 1000 * 60;
		} else if (event.key == 'b') {
			Varphyloader.nextTime -= 1000 * 60;
			if (Varphyloader.diff < 0) Varphyloader.nextTime = new Date().getTime();
		} else if (event.key == 'f') {
			Varphyloader.showFilmLoader = !Varphyloader.showFilmLoader;
			if (Varphyloader.showFilmLoader) {
				// Show
				jQuery('.filmloader').show();
			} else {
				// Hide
				jQuery('.filmloader').hide();
			}
		}
	});
	
	this.frame();
};
Varphyloader.setup = function() {
	this.nextTime = new Date().getTime();
	this.diff = 0;
};
Varphyloader.update = function() {
	var now = new Date().getTime();
	var diff = this.nextTime - now;
	this.diff = diff;
	if (this.diff < 0) {
		$('span.timer').html('00:00:00');
		return false;
	}
	var seconds = Math.floor(diff / 1000) % 60;
	diff -= seconds;
	diff /= 1000;
	var mins = Math.floor(diff / 60) % 60;
	diff -= mins;
	diff /= 60;
	var hours = Math.floor(diff / 60);
	
	if (seconds < 10) seconds = '0' + seconds;
	if (mins < 10) mins = '0' + mins;
	if (hours < 10) hours = '0' + hours;
	
	$('span.timer').html(hours + ':' + mins + ':' + seconds);
};

var GalleryRotate = {};
GalleryRotate.boot = function() {
	GalleryRotate.setup();
};
GalleryRotate.setup = function() {
	// Start anim
	GalleryRotate.stepCount = 0;
	
	var startInterval = function() {
		GalleryRotate.lastSwitchTimestamp = new Date().getTime();
		GalleryRotate.interval = setInterval(function() {
			GalleryRotate.stepCount++;
			GalleryRotate.lastSwitchTimestamp = new Date().getTime();
			GalleryRotate.update(GalleryRotate.stepCount);
		}, switchTimeMS);
	};
	
	// First round
	GalleryRotate.update(0);
	startInterval();
	
	// Listeners
	document.addEventListener('keydown', function(event) {
		if (event.key == 'g') {
			// Switch and restart interval
			GalleryRotate.stepCount++;
			GalleryRotate.update(GalleryRotate.stepCount);
			clearInterval(GalleryRotate.interval);
			startInterval();
		}
	});
};
GalleryRotate.update = function(stepCount) {
	var index = stepCount % 8;
	console.log('stepCount', stepCount, 'index', index);
	
	// Inject first
	var desc = descriptions[index];
	
	// Image
	jQuery('.preview img').attr('src', '');
	jQuery('.preview img').attr('src', desc.image);
	
	// Title
	jQuery('.description .title').html(desc.title);
	
	// Content
	jQuery('.description .content').html(desc.content);
	
};

var Klok = {};
Klok.boot = function() {
	
	// Animate
	Klok.anim = null;
	Klok.frame = function() {
		Klok.update();
		Klok.anim = window.requestAnimationFrame(Klok.frame);
	};
	
	var can = document.getElementById('klok');
	this.ctx = can.getContext('2d')
	this.w = can.width,
	this.h = can.height;
	this.color = 'rgba(255, 255, 255, 0.7)';
		
	this.x0 = this.w/2; this.y0 = this.h/2; this.r = 0.3 * this.w; this.theta0 = -Math.PI/2;
	
	this.frame();
};
Klok.update = function() {
	var time = new Date().getTime(),
		timestampDiff = time - GalleryRotate.lastSwitchTimestamp,
		ratio = timestampDiff / switchTimeMS;
	
	// Clear previous
	this.ctx.clearRect(0, 0, this.w, this.h);
	
	// Redraw outline
	this.ctx.beginPath();
	this.ctx.arc(this.x0, this.y0, 0.4 * this.w, 0, 2 * Math.PI, false);
	this.ctx.strokeStyle = this.color;
	this.ctx.lineWidth = 2;
	this.ctx.stroke();
	this.ctx.closePath();
	
	var theta = this.theta0 + 2 * Math.PI * ratio;
	
	// New cheese slice
	var x = this.x0 + this.r * Math.cos(this.theta0),
		y = this.y0 + this.r * Math.sin(this.theta0);
		
	this.ctx.beginPath();
	this.ctx.moveTo(x, y);
	
	this.ctx.lineTo(this.x0, this.y0);
	
	x = this.x0 + this.r * Math.cos(theta);
	y = this.y0 + this.r * Math.sin(theta);
	
	this.ctx.lineTo(x, y);
	
	this.ctx.arc(this.x0, this.y0, this.r, theta, this.theta0, true);
	
	this.ctx.fillStyle = this.color;
	this.ctx.fill();
	this.ctx.closePath();
};

jQuery(document).ready(function() {
	LoadScreen.start();
});
