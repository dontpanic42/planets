Planets.Level = {
	generate : function(game, viewport) {
		var avgGapX = 300;
		var avgGapY = 300;
		var rndGapX = 200;
		var rndGapY = 160;
		var avgSize = 40;
		var rndSize = 40;

		var w = viewport.w, h = viewport.h;

		var resX = (w / (avgGapX)) | 0;
		var resY = (h / (avgGapY)) | 0;


		var first, last;

		var spawnRandom = function(game, fraction, planet) {
			var rnd = Math.round(Math.random() * 6) + 2;
			for(var i = 0; i < rnd; i++) {
				planet.spawnShip(game, fraction)
			}
		}

		console.log("Starting level generator");
		var rndx, rndy, rnds, o, cache = new Array(resX);
		for(var x = 1; x < resX; x++) {
			cache[x] = new Array(resY);
			for(var y = 1; y < resY; y++) {
				rndx = ((x * avgGapX) - (rndGapX/2) + (Math.random() * rndGapX)) | 0;
				rndy = ((y * avgGapY) - (rndGapY/2) + (Math.random() * rndGapY)) | 0;
				rnds = (avgSize - (rndSize / 2) + (Math.random() * rndSize)) | 0;
				o = new Planets.Renderable.Planet({x: rndx, y: rndy}, rnds, Planets.GeneratePlanetName());
				//game.push(o);
				//game.bgPush(o);
				game.fxLayer.include(o);
				game.bgLayer.include(o, "bgUpdate", "bgRender");
				game.fgLayer.include(o, null, "renderUI");

				if(x == 1 && y == 1) first = o;
				if(x == resX-1 && y == resY-1) last = o;

				cache[x][y] = o;
				if(cache[x][y-1]) {
					o.connect(cache[x][y-1]);
					cache[x][y-1].connect(o);
				}

				if(cache[x-1] && cache[x-1][y-1]) {
					o.connect(cache[x-1][y-1]);
					cache[x-1][y-1].connect(o);
				}

				if(cache[x-1] && cache[x-1][y+1]) {
					o.connect(cache[x-1][y+1]);
					cache[x-1][y+1].connect(o);
				}

				if(cache[x-1] && cache[x-1][y]) {
					o.connect(cache[x-1][y]);
					cache[x-1][y].connect(o);
				}


			}
		}

		if(first && last) {
			//Spawn player in the top left corner
			first.owner = Fraction.Player;
			Planets.stats.planets[Fraction.Player]++;
			spawnRandom(game, Fraction.Player, first);
			for(var i = 0; i < first.connections.length; i++) {
				first.connections[i].owner = Fraction.Player;
				spawnRandom(game, Fraction.Player, first.connections[i]);
				Planets.stats.planets[Fraction.Player]++;
			}

			//Spawn enemy in the bottom right corner
			last.owner = Fraction.Enemy;
			Planets.stats.planets[Fraction.Enemy]++;
			spawnRandom(game, Fraction.Enemy, last);
			game.skynet.addPlanet(last);
			for(var i = 0; i < last.connections.length; i++) {
				if(last.connections[i].owner != Fraction.Player) {
					last.connections[i].owner = Fraction.Enemy;
					spawnRandom(game, Fraction.Enemy, last.connections[i]);
					game.skynet.addPlanet(last.connections[i]);
					Planets.stats.planets[Fraction.Enemy]++;
				}
			}
		}
	},

	getSize : function() {
		return {
			w : 2000,
			h : 2000
		};
	},

	getName : function() {
		return "Deathmatch";
	},

	getDescription : function() {
		return "A random generated galaxy awaits you.<br> Your task: Kill everyone except yourself.";
	},

	checkEndCondition : function(game, viewport) {
		if(Planets.stats.planets[Fraction.Enemy] <= 0) {
			game.stop();
			alert('Congrats: You won!');
		} else if(Planets.stats.planets[Fraction.Player] <= 0) {
			game.stop();
			alert('Sorry: You lost...');
		}
	}
}