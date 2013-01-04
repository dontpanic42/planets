var PI2 = Math.PI * 2;
var PID4 = PI2 / 4;
var PID1024 = PI2 / 1024;
var PID180 = 180 / (Math.PI);

var debug = true;
var debugAI = false;

/***********************************************************************
 * Glaxy Builder
 **********************************************************************/

Planets.Build = function(game, viewport) {
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
			Planets.Build.spawnRandom(game, Fraction.Player, first);
			for(var i = 0; i < first.connections.length; i++) {
				first.connections[i].owner = Fraction.Player;
				Planets.Build.spawnRandom(game, Fraction.Player, first.connections[i]);
			}

			//Spawn enemy in the bottom right corner
			last.owner = Fraction.Enemy;
			Planets.Build.spawnRandom(game, Fraction.Enemy, last);
			game.skynet.addPlanet(last);
			for(var i = 0; i < first.connections.length; i++) {
				last.connections[i].owner = Fraction.Enemy;
				Planets.Build.spawnRandom(game, Fraction.Enemy, last.connections[i]);
				game.skynet.addPlanet(last.connections[i]);
			}
	}
}

Planets.Build.spawnRandom = function(game, fraction, planet) {
	var rnd = Math.round(Math.random() * 10) + 2;
	for(var i = 0; i < rnd; i++) {
		planet.spawnShip(game, fraction)
	}
}

Planets.GeneratePlanetName = function() {
	return Planets.const.planetNames.prefix[ 
			(Math.random() * Planets.const.planetNames.prefix.length) | 0] + " " +
		Planets.const.planetNames.names[
			(Math.random() * Planets.const.planetNames.names.length) | 0] + " " +
		Planets.const.planetNames.postfix[ 
			(Math.random() * Planets.const.planetNames.postfix.length) | 0];
}

/***********************************************************************
 * A* Pathfinder
 **********************************************************************/

Planets.Path = function(start, destination) {
	// a custom hash function to access objects faster. This works because planets
	// are not supposed to be in the exact same location.
	var hash = function(node) { return node.position.x + "" + node.position.y; }
	// the heueristic uses simple distance. Maybe this could be replaced by s.t.
	// faster like manhattan distance.
	var heur = function(node1, node2) { return distance(node1.position, node2.position); }
	// helper function to check if a hash-map is empty.
	var empty = function(list) { for(var x in list) return false; return true; }


	var f_score = {};
	var g_score = {};

	var close = {};
	var open  = {};
	var path  = [];

	var lowf = function() {
		var l = Infinity, n = null;
		for(var i in open) {
			if(f_score[i] < l) {
				l = f_score[i];
				n = open[i];
			}
		}
		return n;
	};	

	var current;
	open[hash(start)] = start;
	g_score[hash(start)] = 0;
	f_score[hash(start)] = heur(start, destination);
	var neighbour, t_score, hn, hc;

	while(!empty(open)) {
		current = lowf();
		if(current == destination) { path.push(current); return path; }

		hc = hash(current);
		delete open[hc];
		close[hc] = current;

		for(var i = 0; i < current.connections.length; i++) {
			neighbour = current.connections[i];
			hn = hash(neighbour);
			if(hn in close) continue; 

			t_score = g_score[hc] + heur(current, neighbour);

			if( !(hn in open) || 
				(hn in g_score && t_score < g_score[hash(neighbour)])) {
				//This isn't in the original algorithm according to
				//wikipedia but "good paths" afaik do not contain
				//cycles and it makes reconstructing easier, so
				//lets do it.
				if(path.indexOf(current) == -1) path.push(current);

				g_score[hn] = t_score;
				f_score[hn] = t_score + heur(neighbour, destination);

				if(!(hn in open)) open[hn] = neighbour;
			}
			
		}
	}

	return null;
}

/***********************************************************************
 * Animation
 **********************************************************************/

Planets.Animation = function() { }

/**
 * Returns values between a and b, starting with a.
 * If circle is true, this animation will never finish.
 */
Planets.Animation.Linear = function(a, b, circle, speed) {
	this.a = a;
	this.b = b;
	this.direction = (b>a)? 1 : -1;
	this.circle = circle,
	this.speed = speed / 1000;
	this.start = Date.now();
	this.current = this.a;
}

Planets.Animation.Linear.prototype.isFinished = function() {
	if(this.b>this.a) {
		return (this.current>=this.b);
	} else {
		return (this.current<=this.b);
	}
}

Planets.Animation.Linear.prototype.next = function() {
	if(this.isFinished()) {
		if(this.circle)
			this.switch();
		else
			return this.b;
	}

	this.current = this.a + ((Date.now() - this.start) * this.speed * this.direction);
	return this.current;
}

Planets.Animation.Linear.prototype.switch = function() {
	var tmp = this.a;
	this.a = this.b;
	this.b = tmp;

	this.direction = -this.direction;
	this.start = Date.now();
	this.current = this.a;
}

/**
 * Reports 'true' after "interval" ms.
 */
Planets.Animation.Burst = function(interval, randomizeStart) {
	this.time = Date.now();
	if(randomizeStart) this.time -= Math.round(Math.random() * interval);
	this.interval = interval;
}

Planets.Animation.Burst.prototype.next = function() {
	if(Date.now() - this.time > this.interval) {
		this.time = Date.now();
		return true;
	}

	return false;
}

Planets.Animation.Burst.prototype.isFinished = function() {
	return false;
}

/***********************************************************************
 * Game
 **********************************************************************/

Planets.Main = function(w, h) { 

	this.bgLayer = RenderLayer.create();
	this.fgLayer = RenderLayer.create();
	this.fxLayer = RenderLayer.create();

	this.w = w; this.h = h;			//logical height/width

	this.interval;
	this.lastUpdate = this.firstUpdate = Date.now();

	this.selected = null;
}

Planets.Main.prototype.init = function() {
	//create lookup table for sin/cos angles
	//default is 1024 steps (1°=360/1024)
	Planets.lookup = {sin: [], cos: []};
	var ang;
	for(var i = 0; i < 1024; i++) {
		ang = PI2 * i / 1024;
		Planets.lookup.cos[i] = Math.cos(ang);
		Planets.lookup.sin[i] = Math.sin(ang);
	}

	this.skynet = new Planets.Skynet();

	this.viewport = new Planets.Viewport(this, this.w, this.h);
	this.key = new Planets.Keymap(this, this.viewport);
	this.mouse = new Planets.Mouse(this, this.viewport);

	this.skynetUpdate = new Planets.Animation.Burst(Planets.const.skynetConfig.updateRate);

	Planets.Build(this, this.viewport);

	Planets.Renderable.Missile.cache = new Planets.Renderable.MissileCache();

	this.fxLayer.include(Planets.Renderable.Missile.cache);
}

Planets.Main.prototype.start = function() {
	this.interval = setInterval(this.loop.bind(this), Planets.const.updateInterval);
}

Planets.Main.prototype.stop = function() {
	clearInterval(this.interval);
}

Planets.Main.prototype.loop = function() {

	var deltaTime = Date.now() - this.lastUpdate;
	if(deltaTime == 0) deltaTime = 1;
	this.lastUpdate = Date.now();
	var gameTime  = this.lastUpdate - this.firstUpdate;

	this.viewport.handleInput(this.mouse, this.key, this.touch);
	this.viewport.clear();

	if(debug) DebugOutput.fpsTimer.updateStart();

	if(this.skynetUpdate.next(deltaTime))
		this.skynet.evaluate();

	this.fxLayer.update(this, this.viewport, deltaTime, gameTime);
	this.bgLayer.update(this, this.viewport, deltaTime, gameTime);
	this.fgLayer.update(this, this.viewport, deltaTime, gameTime);


	if(debug) {
		DebugOutput.fpsTimer.updateEnd();
		DebugOutput.fpsTimer.renderStart();
	}

	this.fxLayer.render(this, this.viewport, this.viewport.context, deltaTime, gameTime).invalidate();
	this.fgLayer.render(this, this.viewport, this.viewport.context, deltaTime, gameTime).invalidate();
	this.bgLayer.render(this, this.viewport, this.viewport.bgcontext, deltaTime, gameTime);

	if(debug) {
		DebugOutput.fpsTimer.renderEnd();
		DebugOutput.fpsTimer.show();
		DebugOutput.flush(this.viewport, this.viewport.context);
	}
}


/***********************************************************************
 * Renderable
 **********************************************************************/

Planets.Renderable = function() { }

Planets.Renderable.prototype.position = {x: 0, y: 0}
Planets.Renderable.prototype.renderIndex = 0;

Planets.Renderable.prototype.init = function() { }
Planets.Renderable.prototype.load = function() { }
Planets.Renderable.prototype.update = function(game, viewport, gameTime, deltaTime) { }
Planets.Renderable.prototype.bgUpdate = function(game, viewport, gameTime, deltaTime) { }
Planets.Renderable.prototype.render = function(game, viewport, context, deltaTime, gameTime) { }
Planets.Renderable.prototype.bgRender = function(game, viewport, context, deltaTime, gameTime) { }
Planets.Renderable.prototype.destroy = function() { }

/***********************************************************************
 * Planet
 **********************************************************************/

Planets.Renderable.Planet = function(position, radius, name) {
	this.name = name;
	this.position = position;
	this.radius = radius;
	this.color = Planets.Renderable.Planet.colors.random();
	this.connections = [];
	this.mouseOver = false;

	this.ships = Store.create(Fractions.length);

	//this.shipCount = new Array(Fractions.length); 
	this.shipSelected = (new Array(Fractions.length)).init(0); 

	//Ownership stuff
	this.ownerChangeStart = null;
	this.ownerApplicant = null;
	this.owner = Fraction.Neutral;
	this.spawnTimer = null;

	//Animation
	this.ownerAnimation = new Planets.Animation.Linear(0.2, 1.0, true, 1);
	this.grdInner = this.grdOuter = null;

	//Properties of path preview
	this.path = null;
}
// Planets.Renderable.Planet.colors = ["rgb(109,133,193)","rgb(173,116,109)","rgb(239,175,65)"];
Planets.Renderable.Planet.colors = Planets.const.planetForegroundColors;
Planets.Renderable.Planet.prototype = new Planets.Renderable();
Planets.Renderable.Planet.prototype.constructor = Planets.Renderable.Planet;

Planets.Renderable.Planet.prototype.connect = function(planet) {
	this.connections.push(planet);
}

Planets.Renderable.Planet.prototype.spawnShip = function(game, fraction) {
	var s = new Planets.Renderable.Ship(this, fraction);
	game.fxLayer.include(s.init());
	s.attached = true;
	this.ships[fraction].add(s);
	return s;
}

Planets.Renderable.Planet.prototype.attachShip = function(ship) {
	ship.attached = true;
	this.ships[ship.getFraction()].add(ship);
}

Planets.Renderable.Planet.prototype.removeShip = function(ship) {
	if(!ship.attached) return;
	ship.attached = false;
	this.ships[ship.getFraction()].remove(ship);
}

Planets.Renderable.Planet.prototype.moveSelectedShips = function(target, fraction) {
	var path = Planets.Path(this, target);
	var self = this;
	this.ships[fraction].times(function () {
		this.moveTo(path);
		self.removeShip(this);
	}, Math.min(this.ships[fraction].size, this.shipSelected[fraction]));
}

Planets.Renderable.Planet.prototype.getRandomEnemy = function(forFraction) {
	return this.ships[(forFraction == Fraction.Player)? Fraction.Enemy : Fraction.Player].random();
}

Planets.Renderable.Planet.prototype.showPathPreview = function(path) {
	this.path = path;
}

Planets.Renderable.Planet.prototype.hidePathPreview = function() {
	this.path = null;
}

Planets.Renderable.Planet.prototype.checkOwnership = function() {
	// 1. When neutral and ships of only one fraction and no timer, start timer.
	var oneFractionPresent = false;
	var noFractionPresent = true;
	var oneFractionIndex = null;

	for(var i = 0; i < Fractions.length; i++) {
		if(this.ships[i].size > 0) {
			if(oneFractionIndex == null) {
				noFractionPresent = false;
				oneFractionIndex = i;
				oneFractionPresent = true;
			} else {
				oneFractionPresent = false;
			}
		}
	}

	//Only one fraction is present: Owner change imminent.
	if(oneFractionPresent) {
		if(this.owner == oneFractionIndex) return;
		if(this.ownerChangeStart == null || this.ownerApplicant != oneFractionIndex) {
			this.ownerChangeStart = Date.now();
			this.ownerApplicant = oneFractionIndex;
			console.log(this.name + ": Ownership change imminent.")
		} else {
			if(Date.now() - this.ownerChangeStart >= Planets.const.planetOwnerChangeRate) {
				this.owner = oneFractionIndex;
				this.ownerChangeStart = null;
				this.ownerApplicant = null;
				this.spawnTimer = Date.now();
				console.log("Planet " + this.name + " now belongs to " + Fractions[this.owner].name);
			}
		}
	// zero or more fractions present: stop ownership change, do nothing.
	} else {
		if(this.ownerChangeStart) {
			this.ownerChangeStart = null;
			this.ownerApplicant = null;
		}
	}
}

Planets.Renderable.Planet.prototype.checkSpawn = function(game) {
	if(this.owner == Fraction.Neutral) return;
	if(Date.now() - this.spawnTimer >= Planets.const.planetSpawnRate) {
		this.spawnTimer = Date.now();
		if(this.ships[this.owner].size > Planets.const.planetSpawnMaxPresent) return;
		this.spawnShip(game, this.owner);
	}
}

Planets.Renderable.Planet.prototype.update = function(game, viewport, deltaTime, gameTime) {
	var pos = game.mouse.position;
	if( pos.x >= this.position.x - this.radius &&
		pos.x <= this.position.x + this.radius &&
		pos.y >= this.position.y - this.radius &&
		pos.y <= this.position.y + this.radius) {
		game.selected = this;
		this.mouseOver = true;
	} else {
		if(game.selected == this)
			game.selected = null;
		this.mouseOver = false;
	}


	if(this.mouseOver) {
		this.shipSelected[Fraction.Player] = Math.max(0, Math.min(
			this.shipSelected[Fraction.Player] + game.mouse.getClearDelta(), 
			this.ships[Fraction.Player].size));

		//Preview possible path to this planet
		if(game.mouse.down && game.mouse.currentDown != this && !this.path)
			this.showPathPreview(Planets.Path(game.mouse.currentDown, this));
	} 

	if(this.path && (!this.mouseOver || !game.mouse.currentDown))
		this.hidePathPreview();

	this.checkOwnership();
	this.checkSpawn(game);
}

Planets.Renderable.Planet.prototype.render = function(game, viewport, context, deltaTime, gameTime) {
	// if this is offscreen, do not render.
	if(!viewport.circleVisible(this.position.x, this.position.y, this.radius)) return;

	// Draw connections
	if(this.mouseOver && this.connections.length >= 0 && !this.path) {
		context.beginPath();
		context.lineWidth = 1;
		context.strokeStyle = Planets.const.planetConnectionColor;

		for(var i = 0; i < this.connections.length; i++)
			this.renderPath(context, this, this.connections[i]);

		context.stroke();

	} else if(this.path) {
		context.lineWidth = 2;
		context.beginPath();
		context.strokeStyle = Planets.const.planetPathColor;

		for(var i = 0; i < this.path.length - 1; i++)
			this.renderPath(context, this.path[i], this.path[i+1]);

		context.stroke();
	}

	if(debugAI) { //Print skynet prognosted risk.
		context.beginPath();
		context.fillStyle = "#ffffff";
		context.font = "10pt Verdana";
		var str = "AIR: " + game.skynet.getDebug(this);
		context.fillText(str, this.position.x - (context.measureText(str).width / 2), this.position.y + 90);
		context.fill();
	}

	//Draw ownership
	if(this.owner != Fraction.Neutral) {
		context.beginPath();
		context.lineWidth = 4;
		context.globalAlpha = (this.ownerApplicant)? this.ownerAnimation.next(deltaTime) : 0.8;
		context.strokeStyle = Fractions[this.owner].color;
		context.arc(this.position.x, this.position.y, this.radius - 2, 0, PI2);
		context.stroke();
		context.globalAlpha = 1.0;
	}

	//Draw UI
	if(this.mouseOver)
		this.renderStatusUI(context);

}

Planets.Renderable.Planet.prototype.renderStatusUI = function(context) {
	var x = this.position.x, y = this.position.y, r = this.radius;


	// if(this.shipCount[Fraction.Player]) {
	if(this.ships[Fraction.Player].size) {
		context.beginPath();
		context.lineWidth = 12;

		// Selection dial background
		context.strokeStyle = Planets.const.planetDialBackground;
		context.arc(x, y, r + 12, 0, PI2);
		context.stroke();

		// Selection dial foreground
		if(this.shipSelected) {
			context.beginPath();
			context.strokeStyle = this.color;
			context.globalAlpha = 0.5;
			context.arc(x, y, r + 12, 0, (this.shipSelected[Fraction.Player] / this.ships[Fraction.Player].size) * PI2);
			context.stroke();	
			context.globalAlpha = 1;
		}

		// Draw text
		context.beginPath();
		context.fillStyle = Planets.const.planetNameFillColor;
		context.strokeStyle = Planets.const.planetNameBorderColor;
		context.lineWidth = 1;
		context.font = 'bold 16pt Verdana';
		var str = this.shipSelected[Fraction.Player] + "/" + this.ships[Fraction.Player].size;
		var dim = (context.measureText(str).width / 2) | 0;
		context.textBaseline = "middle";

		context.fillText(str, x - dim, y);
		context.strokeText(str, x - dim, y);
	}

	//Draw planet name
	context.fillStyle = Planets.const.planetNameFillColor;
	context.strokeStyle = Planets.const.planetNameBorderColor;
	context.lineWidth = 1;
	context.font = 'bold 16pt Verdana';
	var dim = context.measureText(this.name);
	context.textBaseline = "bottom";

	context.fillText(this.name, x - (dim.width/2), y - r - 16);
	context.strokeText(this.name, x - (dim.width/2), y - r - 16);
}

Planets.Renderable.Planet.prototype.renderPath = function(context, origin, target) {
	var a = angulate(origin.position, target.position) | 0;
	var b = (a + 512); if(b > 1024) b -= 1024;

	context.moveTo(
		origin.position.x + origin.radius * Planets.lookup.cos[a],
		origin.position.y + origin.radius * Planets.lookup.sin[a]);
	context.lineTo(
		target.position.x + target.radius * Planets.lookup.cos[b], 
		target.position.y + target.radius * Planets.lookup.sin[b]);
}

Planets.Renderable.Planet.prototype.bgRender = function(game, viewport, context, deltaTime, gameTime) {
	var x = this.position.x, y = this.position.y, r = this.radius;
	if(!this.grdInner) {
		this.grdInner = context.createRadialGradient(x, y, 5, x, y, r);
		this.grdInner.addColorStop(0, Planets.const.planetCoreColor);
		this.grdInner.addColorStop(1, this.color);

		this.grdOuter = context.createRadialGradient(x, y, r, x, y, r << 1);
		this.grdOuter.addColorStop(0, Planets.const.planetGlowColor0);
		this.grdOuter.addColorStop(1, Planets.const.planetGlowColor1);
	}


	//glow
	context.beginPath();
	context.fillStyle = this.grdOuter;
	context.arc(x, y, r << 1, 0, PI2);
	context.fill();

	//circle & inner
	context.beginPath();
	context.lineStyle = Planets.const.planetBorderColor;
	context.lineWidth = 4;
	context.fillStyle = this.grdInner;
	context.arc(x, y, r, 0, PI2);
	context.stroke();
	context.fill();
}


/***********************************************************************
 * Ship
 **********************************************************************/

Planets.Renderable.Ship = function(planet, fraction) { 
	this.orbit = planet;
	this.position = {x: 0, y: 0};
	this.currentMoveTarget = null;
	this.fraction = fraction;

	this.speed = Planets.const.shipBaseSpeed + ((Math.random() * Planets.const.shipRandomSpeed) | 0);

	this.health = Planets.const.shipInitHealth;
	this.cannon = new Planets.Animation.Burst(Planets.const.shipFireRate, true);

	this.enemy = null;
}

Planets.Renderable.Ship.prototype = new Planets.Renderable();
Planets.Renderable.Ship.prototype.constructor = Planets.Renderable.Ship;
Planets.Renderable.Ship.prototype.orbit = null;
Planets.Renderable.Ship.prototype.speed = 70;

Planets.Renderable.Ship.prototype.init = function() {
	//Angle between the ship and the planet
	this.angle = (Math.random() * (1024)) | 0;
	//Distance between the ship and the planet surface
	this.offset = ((Math.random() * (Planets.const.shipOrbitOffsetMax - Planets.const.shipOrbitOffsetMin) ) + Planets.const.shipOrbitOffsetMin) | 0;

	this.pIndex = 0; //index used in the planet's shiplist, not to be changed.
	this.renderIndex = this.bgRenderIndex = 0; //used in the main loop, not to be changed.
	this.attached = true;

	this.currentMoveTarget = null;	//current target to move to
	this.moveQ = [];				//task que

	return this;
}

Planets.Renderable.Ship.prototype.getFraction = function() { 
	return this.fraction;
}

Planets.Renderable.Ship.prototype.checkFight = function(deltaTime) {
	if(!this.orbit || !this.attached) return;

	if(this.cannon.next(deltaTime)) {

		if(!(this.enemy && this.enemy.health > 0) || this.enemy.orbit != this.orbit) 
			this.enemy = this.orbit.getRandomEnemy(this.fraction);
		
		if(this.enemy)
			Planets.Renderable.Missile.send(this, this.enemy);
	}
}

Planets.Renderable.Ship.prototype.kill = function(game) {
	game.fxLayer.remove(this);
	if(this.orbit && this.attached)
		this.orbit.removeShip(this);
}

Planets.Renderable.Ship.prototype.update = function(game, viewport, deltaTime, gameTime) {

	if(this.health <= 0) {
		this.kill(game);
		return;
	}

	if(this.currentMoveTarget == null && this.moveQ.length > 0) 
		this.currentMoveTarget = this.moveQ.shift();

	if(this.orbit) {
		this.angle += (this.speed * (deltaTime / 1000));
		if(this.angle >= 1024) this.angle -= 1024;

		this.position.x = (this.orbit.position.x + (this.orbit.radius + this.offset) * Planets.lookup.cos[this.angle | 0]);
 		this.position.y = (this.orbit.position.y + (this.orbit.radius + this.offset) * Planets.lookup.sin[this.angle | 0]);
	} 

	if(this.currentMoveTarget) {
		var target = this.currentMoveTarget;

		//Reached orbit.
		if(distance(this.position, target.position) <= (target.radius + this.offset)) {
			this.orbit = this.currentMoveTarget;
			this.currentMoveTarget = null;
			this.angle = angulate(this.position, this.orbit.position) + 512;
			//only attach this ship to an orbit if the moveQ is empty...
			if(!this.moveQ.length) this.orbit.attachShip(this);
			return;
		}

		//still in orbit... wait for correct angle to take off...
		if(this.orbit) {
			var requiredA = angulate(this.orbit.position, target.position);
			if(Math.abs(requiredA - this.angle) < 10) {
				this.orbit = null;
				this.angle = requiredA + (1024*0.75);
				this.enemy = null;
			}
			return;
		}

		var a = angulate(this.position,target.position);
		var speed = this.speed * (deltaTime / 1000);

		this.position.x = (this.position.x + speed * Planets.lookup.cos[a | 0]);
		this.position.y = (this.position.y + speed * Planets.lookup.sin[a | 0]);
	}

	this.checkFight(deltaTime);
}

Planets.Renderable.Ship.prototype.moveTo = function(path) {
	if(path.length > 1) 
		for(var i = 1; i < path.length; i++)
			this.moveQ.push(path[i]);
}

Planets.Renderable.Ship.prototype.render = function(game, viewport, context, deltaTime, gameTime) {
	if(!viewport.circleVisible(this.position.x, this.position.y, 2)) return;

	if(this.health < 0) return;

 	context.save();
 	context.beginPath();    
 	context.fillStyle = Fractions[this.fraction].color;
 	context.translate(this.position.x, this.position.y);
    context.rotate( ((PID1024) * this.angle) + (PID4) );
 	context.moveTo(0, 0);
 	context.bezierCurveTo(0, 4, 4, 4, 12, 0);
 	context.bezierCurveTo(4, -4, 0, -4, 0, 0);
	context.fill();

 	//if not in orbit or moving to target, draw the "engine exhaust"
	if(!this.orbit || this.currentMoveTarget) {
		context.beginPath();
		context.fillStyle = Planets.const.shipExhaustColor;
		context.arc(-2, 0, 2, 0, PI2);
		context.fill();
	}

	context.restore();
}

/***********************************************************************
 * Missile
 **********************************************************************/

Planets.Renderable.Missile = function(origin, target) { 
	this.speed = Planets.const.missileSpeed;
	this.angle = 0;
	this.position = {x: origin.position.x, y: origin.position.y};
	this.target = target;
	this.finished = false;
	this.index = 0;
}

Planets.Renderable.Missile.prototype = new Planets.Renderable();
Planets.Renderable.Missile.prototype.constructor = Planets.Renderable.Missile;

Planets.Renderable.Missile.send = function(origin, target) { 
	Planets.Renderable.Missile.cache.get(origin, target);
}

Planets.Renderable.Missile.cache = null;

Planets.Renderable.Missile.prototype.reset = function(origin, target) {
	this.position.x = origin.position.x;
	this.position.y = origin.position.y;
	this.target = target;
	this.finished = false;
}


Planets.Renderable.Missile.prototype.isFinished = function() {
	return this.finished;
}

Planets.Renderable.Missile.prototype.update = function(game, viewport, deltaTime, gameTime) {
	if(this.finished) return;

	this.angle = angulate(this.position, this.target.position);

	var speed = this.speed * (deltaTime / 1000);
	this.position.x = (this.position.x + speed * Planets.lookup.cos[this.angle | 0]);
	this.position.y = (this.position.y + speed * Planets.lookup.sin[this.angle | 0]);

	if(distance(this.position, this.target.position) < 10) {
		this.target.health -= Planets.const.missileBaseDamage + (Math.random() * Planets.const.missileRandomDamage);
		this.finished = true;
		Planets.Renderable.Missile.cache.retain(this);
	} else if(!this.target.orbit || this.target.health < 0) {
		this.finished = true;
		Planets.Renderable.Missile.cache.retain(this);
	}
}

Planets.Renderable.Missile.prototype.render = function(game, viewport, context, deltaTime, gameTime) {
	if(this.finished) return;
	context.save();
	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = Planets.const.missileColor;
 	context.translate(this.position.x, this.position.y);
    context.rotate( ((PID1024) * this.angle) );
 	context.moveTo(0, 0);
 	context.lineTo(-4, 0);
 	context.stroke();
	context.restore();
}

Planets.Renderable.MissileCache = function() {
	this.cache = [];
	this.cacheSlots = [];
	this.free  = [];
	this.renderIndex = 0;
}

Planets.Renderable.MissileCache.prototype = new Planets.Renderable();
Planets.Renderable.MissileCache.prototype.constructor = Planets.Renderable.MissileCache;

Planets.Renderable.MissileCache.prototype.get = function(origin, target) {
	if(!this.free.length) {
		var m = new Planets.Renderable.Missile(origin, target);
	} else {
		var m = this.free.pop();
		m.reset(origin, target);
	}

	if(this.cacheSlots.length) {
		m.index = this.cacheSlots.pop();
		this.cache[m.index] = m;
	} else {
		m.index = this.cache.length;
		this.cache.push(m);
	}
}

Planets.Renderable.MissileCache.prototype.retain = function(missile) {
	this.free.push(missile);
	this.cache[missile.index] = null;
	this.cacheSlots.push(missile.index);
}

Planets.Renderable.MissileCache.prototype.update = function(game, viewport, deltaTime, gameTime) {
	for(var i = 0; i < this.cache.length; i++) {
		if(this.cache[i])
			this.cache[i].update(game, viewport, deltaTime, gameTime);
	}
}

Planets.Renderable.MissileCache.prototype.render = function(game, viewport, context, deltaTime, gameTime) {
	for(var i = 0; i < this.cache.length; i++) {
		if(this.cache[i])
			this.cache[i].render(game, viewport, context);
	}
}


/***********************************************************************
 * Skynet
 **********************************************************************/

Planets.Skynet = function() {
	this.planets = {};
	this.me = Fraction.Enemy;

	this.hash = function(planet) { return "P" + planet.position.x + "." + planet.position.y; };

	this.core = [];
	this.border = [];

	this.in_need = [];
	this.free = [];

	this.a_targets = {};
	//TODO: free i_targets when scoring ok again...
	this.i_targets = {};

	this.const = Planets.const.skynetConfig;
}

Planets.Skynet.prototype.evaluate = function() {

	this.updateLists();

	this.redistributeCoreShips();

	this.evaluateCurrentTargets();
}

Planets.Skynet.prototype.addPlanet = function(planet) {
	this.planets[this.hash(planet)] = planet;
}

Planets.Skynet.prototype.updateLists = function() {
	var p;
	this.core = []; this.border = []; this.in_need = []; this.free = [];

	//Splits planets in core and border planets.
	for(var i in this.planets) {
		p = this.planets[i];
		if(p.owner != this.me) continue;

		if(this.isBorderPlanet(p))
			this.border.push(p);
		else
			this.core.push(p);
	}

	//search border planets in need of troops
	var r;
	for(var i = 0; i < this.border.length; i++) {
		r = this.getRequiredShips(this.border[i]);
		r+= (this.const.targetRatio - 1) * r;

		if(r>0) {
			//requires troops
			this.in_need.push(this.border[i]);
		} else {
			//can spend troops
			if(r < 0) {
				this.free.push({
					count : -r,
					origin : this.border[i]
				});
			}
		}
	}
}

Planets.Skynet.prototype.redistributeCoreShips = function() {
	var p, c;
	for(var i = 0; i < this.core.length; i++) {
		p = this.core[i];
		// c = p.shipCount[this.me] - this.const.baseAmount;
		c = p.ships[this.me].size - this.const.baseAmount;
		if(c <= 0) continue;

		for(var x = 0; x < c; x++) {
			p.shipSelected[this.me] = 1;
			if(this.in_need.length > 0) {
				//Send ships to those border planets who need them.
				p.moveSelectedShips(this.in_need[(Math.random() * this.in_need.length) | 0], this.me);
			} else {
				//If no one needs them send ships to any border planets (to keep core for farming)
				p.moveSelectedShips(this.border[(Math.random() * this.border.length) | 0], this.me);
			}
		}
	}
}

Planets.Skynet.prototype.evaluateCurrentTargets = function() {
	var counter = 0, tmp = null;
	//Check if current targets are still valid targets...
	for(var i in this.a_targets) {

		if(i in this.i_targets)
			delete this.i_targets[i];

		//TODO: this sometimes doesn't work...
		if(this.a_targets[i].owner == this.me) {
			this.planets[i] = this.a_targets[i];
			delete this.a_targets[i];
			continue;
		}

		tmp = this.scoreTarget(this.a_targets[i]);
		if(tmp.score < this.const.targetFail) {
			delete this.a_targets[i];
			this.i_targets[i] = tmp.planet;
		} else {
			counter++;
		}
	}

	//check if there are still ships at inactive targets...
	for(var i in this.i_targets) {
		// if(this.i_targets[i].shipCount[this.me] > 0) {
		if(this.i_targets[i].ships[this.me].size > 0) {
			this.free.push({
				// count: this.i_targets[i].shipCount[this.me],
				count: this.i_targets[i].ships[this.me].size,
				origin: this.i_targets[i]
			});
		}
	}

	//if there are free ships go and distribut them on targets...
	var freeCount = 0;
	for(var i = 0; i < this.free.length; i++)
		freeCount += this.free[i].count;

	if(freeCount == 0) return;

	var send = 0;
	for(var i in this.a_targets) {
		tmp = this.scoreTarget(this.a_targets[i]);
		send = Math.max(0, tmp.troops);
		send = Math.min(freeCount, send);

		for(var y = 0; y < this.free.length; y++) {
			send -= this.free[y].count;
			this.free[y].origin.shipSelected[this.me] = this.free[y].count;
			this.free[y].origin.moveSelectedShips(this.a_targets[i], this.me);

			freeCount -= this.free[y].count;
			this.free[y] = null;

			if(send <= 0) break;
		}
	}

	//if there are still free ships, create a new target
	if(freeCount > 0 && counter < this.const.maxTargets) {
		var n = this.searchTarget();
		if(n == null) return;
		if(freeCount >= n.troops) {
			this.a_targets[this.hash(n.planet)] = n.planet;
			for(var z = 0; z < this.free.length; z++) {
				if(this.free[z] == null) continue;

				this.free[z].origin.shipSelected[this.me] = this.free[z].count;
				this.free[z].origin.moveSelectedShips(n.planet, this.me);
			}
		}
	}
}

Planets.Skynet.prototype.searchTarget = function() {
	var s = { score: -Infinity, troops : -Infinity, planet : null}, p = null, tmp = null, tmps = 0;
	for(var i = 0; i < this.border.length; i++) {
		for(var x = 0; x < this.border[i].connections.length; x++) {
			tmp = this.border[i].connections[x];
			if(tmp.owner == this.me || tmp in this.a_targets) continue;

			tmps = this.scoreTarget(tmp);
			if(tmps.score > s.score) {
				s = tmps;
				p = tmp;
			}
		}
	}

	return (p==null)? null: s;
}

Planets.Skynet.prototype.scoreTarget = function(planet) {
	var s = 0, t = 0, p = null;
	// t += planet.shipCount[Fraction.Player];
	// s -= planet.shipCount[Fraction.Player];
	t += planet.ships[Fraction.Player].size;
	s -= planet.ships[Fraction.Player].size;
	for(var i = 0; i < planet.connections.length; i++) {
		if(planet.connections[i].owner == this.me) s += 1;
		// t += this.const.neighbourTroopEstimation * (planet.connections[i].shipCount[Fraction.Player]);
		// s -= this.const.neighbourTroopEstimation * (planet.connections[i].shipCount[Fraction.Player]);
		t += this.const.neighbourTroopEstimation * (planet.connections[i].ships[Fraction.Player].size);
		s -= this.const.neighbourTroopEstimation * (planet.connections[i].ships[Fraction.Player].size);
	}

	return {
		score : s,	//general score
		troops : t,  	//required troops
		planet : planet
	};
}

Planets.Skynet.prototype.isBorderPlanet = function(planet) {
	for(var i = 0; i < planet.connections.length; i++)
		if(planet.connections[i].owner != this.me) return true;
	return false;
}

Planets.Skynet.prototype.getRequiredShips = function(planet) {
	// var mytroops = planet.shipCount[this.me];
	// var enemytroops = planet.shipCount[Fraction.Player];
	var mytroops = planet.ships[this.me].size;
	var enemytroops = planet.ships[Fraction.Player].size;
	for(var i = 0; i < planet.connections.length; i++) {
		if(planet.connections[i].owner == this.me) continue;
		// enemytroops += Math.max(this.const.emptyAmount, this.const.neighbourTroopEstimation * planet.connections[i].shipCount[Fraction.Player]);
		enemytroops += Math.max(this.const.emptyAmount, this.const.neighbourTroopEstimation * planet.connections[i].ships[Fraction.Player].size);
	}

	return (enemytroops - mytroops);
}

Planets.Skynet.prototype.getDebug = function(planet) {
	var str = "";
	if(this.hash(planet) in this.a_targets)
		str += " AT ";
	if(this.hash(planet) in this.i_targets)
		str += " IT "
	if(this.core.indexOf(planet) != -1)
		return str + "Core Planet";
	if(this.border.indexOf(planet) != -1)
		return str + "Border (" + this.getRequiredShips(planet) + ")" + ((this.in_need.indexOf(planet) == -1)? 'OK' : 'UP');

	return str + "Unknown Area";
}

