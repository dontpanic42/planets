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
		}
	],

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
		.appendTo(this.overlay);
		this.loadContainer.css({
			position : "absolute",
			left : ($(window).width() - 200) / 2,
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
				console.log("Setting imag: start");
					this.spinner.get(0).src = "img/start.png";
					break;
			}
		}
	},

	loadFiles : function() {
		for(var i = 0; i < this.files.length; i++) {
			if(!this.files[i].finished) {
				console.log("Loading " + this.files[i].name + " (" + this.files[i].file + ")");
				Loader.setLoadText("Loading: " + this.files[i].name);
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
				return true;
			}
		}

		return false;
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
				this.loadContainer.fadeIn();
			}).bind(this));
		}
	},

	destroyLoadingScreen : function() {
		this.overlay.fadeOut((function() {
			this.game.start();
		}).bind(this));
	}
};