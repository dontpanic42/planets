//Game Loader.
//Use "presets" url-parameter for AI presets, e.g. presets=easy loads 'presets-easy.js'
//Use "level" url-param for loading levels. Default is the random level generator.

var Loader = {

	getParameter : function(name) {
		return decodeURI(
        	(RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    	);
	},

	files : [
		{
			file : 'jquery.mousewheel.js',
			name : 'Mousewheel',
			finished : false
		},
		{
			file : 'presets-default.js',
			name : 'Presets',
			finished : false
		},	
		{
			file : 'planet-util.js',
			name : 'Tools',
			finished : false
		},
		{
			file : 'planet-io.js',
			name : 'Stargate',
			finished : false
		},
		{
			file : 'planet.js',
			name : 'Game files',
			finished : false
		},
		{
			file : 'textures/planet-dirt.png',
			name : 'Textures',
			finished : false,
			id : 'dirt-texture-1'
		// },
		// {
		// 	file : 'textures/planet-reflection.png',
		// 	name : 'Textures',
		// 	finished : false,
		// 	id : 'reflection-texture-1'
		}
	],


	imageCache : {},

	// addFile : function(name, file) {
	// 	this.files.push({
	// 		file : file,
	// 		name : name,
	// 		finished : false
	// 	});
	// },

	load : function() {

		this.files.push({
			file : 'level/' + (((this.getParameter("level")) != "null")? this.getParameter("level") + "js" : "level-random.js"),
			name : 'Level',
			finished : false
		});

		if(this.getParameter("presets") == "easy") {
			this.files.push({
				file : 'presets-easy.js',
				name : 'Galxy',
				finished : false
			});
		}

		this.overlay = $('<div></div>')
		.css({
			position: "absolute",
			top : 0,
			left : 0,
			right : 0,
			bottom : 0,
			backgroundColor : "#000000"
		}).appendTo($('body'));

		$('#menu').css({
			left : ($(window).width() -  $('#menu').outerWidth()) / 2,
			top : ($(window).height() -  $('#menu').outerHeight()) / 2
		});
 		
		this.loadContainer = $('<div></div>')
		.append(this.spinner = $('<img src="img/spinner.gif"></img>')
			.css('verticalAlign', 'middle'))
		.append(this.text = $("<span>Loading</span>")
			.css({
				color : "#ffffff",
				fontSize : 10,
				fontFamily : "Verdana",
				marginLeft : 20
			}))
		.append(this.levelDescription = $('<p></p>')
			.css({
				color : '#777777',
				fontSize : 10,
				fontFamily : "Verdana",
				marginTop : 20
			}))
		.appendTo(this.overlay);
		this.loadContainer.css({
			position : "absolute",
			width : 250,
			left : ($(window).width() - 250) / 2,
			top  : ($(window).height() - this.loadContainer.outerHeight()) / 2,
			zIndex : 20
		});


		this.loadFiles();
	},

	setLoadText : function(msg, msgType) {
		this.text.html(msg);
		this.loadContainer.css({
			left : ($(window).width() - this.loadContainer.outerWidth()) / 2,
			top  : ($(window).height() - this.loadContainer.outerHeight()) / 2
		});

		if(msgType) {
			switch(msgType) {
				case "error":
					this.spinner.get(0).src = "img/error.png";
					break;
				case "start":
					this.spinner.get(0).src = "img/start.png";
					break;
			}
		}
	},

	loadFiles : function() {
		for(var i = 0; i < this.files.length; i++) {
			if(!this.files[i].finished) {
				console.log("Loading " + this.files[i].name + " (" + this.files[i].file + ")");

				var suffix = Loader.getFileSuffix(this.files[i].file);

				Loader.setLoadText("Loading: " + this.files[i].name);
				
				switch(suffix) {
					case 'js':
						Loader.loadScriptFile(i);
						break;
					case 'png':
						Loader.loadImageFile(i);
						break;
				}
				return true;
			}
		}

		return false;
	},

	getFileSuffix : function(name) {
		var i = name.lastIndexOf('.');
		if(i == -1) return 'unknown';

		return name.substring(i + 1);
	},

	loadImageFile : function(i) {
		var img = document.createElement("img");

		img.onload = (function() {
			var which = i;
			return function() {
				Loader.files[which].finished = true;
				Loader.imageCache[Loader.files[which].id] = img;
				Loader.checkFiles();
			}
		})();

		img.onerror = (function() {
			var which = i;
			return function() {
				Loader.setLoadText("Error loading " + Loader.files[which].name, 'error');
				console.log("Failed to load image: ", Loader.files[which].file);
			}
		})();

		img.src = Loader.files[i].file;
	},

	loadScriptFile : function(i) {
		$.getScript("js/" + this.files[i].file)
			 .done((function() {
			 	var which = i;
			 	return function() {
			 		Loader.files[which].finished = true;
			 		Loader.checkFiles();
			 	};
			 })())
			 .fail((function() {
			 	var which = i;
			 	return function() {
					Loader.setLoadText("Error loading " + Loader.files[which].name, 'error');
			 	};
			 })());
	},

	checkFiles : function() {
		if(!this.loadFiles()) {
			if(!Planets || !Planets.Level || !Planets.Main) {
				this.setLoadText("An error occured: Could not start game.", 'error');
				return;
			}
			this.setLoadText("Loading: Game");
			this.game = new Planets.Main(
					Planets.Level.getSize().w,
					Planets.Level.getSize().h
				);

			this.game.init();

			this.loadContainer.fadeOut((function() {
				this.setLoadText($('<a href="#">Klick to start: ' + Planets.Level.getName() + '</a>')
					.css({
						textDecoration : "none",
						color : "#ffffff"
					})
					.click(this.destroyLoadingScreen.bind(this)), 'start');
				this.levelDescription.html(Planets.Level.getDescription());
				this.loadContainer.fadeIn();
			}).bind(this));
		}
	},

	destroyLoadingScreen : function() {
		this.overlay.fadeOut((function() {
			this.game.start();
		}).bind(this));
	},

	getImage : function(id) {
		if(!(id in this.imageCache)) return null;
		return this.imageCache[id];
	}
};