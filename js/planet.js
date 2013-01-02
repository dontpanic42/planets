var Planets = {};
var PI2 = Math.PI * 2;
var PID4 = PI2 / 4;
var PID1024 = PI2 / 1024;
var PID180 = 180 / (Math.PI);

var debug = true;

var distance  = function(position1, position2) {
	var x2 = position2.x,
		y2 = position2.y;
	return Math.sqrt((x2 -= position1.x) * x2 + (y2 -= position1.y) * y2);
}

var angulate = function(position1, position2) {
	var a = Math.atan2(-(position2.y-position1.y), (position2.x-position1.x)) * (1024/PI2);
	return 1024 - ((a < 0)? a + 1024 : a);
}

var Keys = {
	LEFT : 37,
	RIGHT : 39,
	UP : 40,
	DOWN : 38
};

//Time in ms it takes to change the planet ownership.
var ownershipChangeRate = 10000;
//Time in ms to spawn new ships.
var planetSpawnRate = 12000;
//If mor than planetSpawnMaxPresent ships of a fraction
//are in orbit, stop spawning (overpopulation)
var planetSpawnMaxPresent = 12;

var Fractions = [
	{
		color : "rgb(15,183,209)",
		name  : "Player",
		planetCount : 0
	},
	{
		color : "rgb(255,128,154)",
		name  : "Enemy",
		planetCount : 0
	},
	{
		color : "rgb(204,166,109)",
		name  : "Pirates",
		planetCount : 0
	},
	{
		color : "rgb(255,255,255)",
		name  : "Neutral",
		planetCount : 0
	}
];

var Fraction = {
	Player : 0,
	Pirates: 2,
	Enemy : 1,
	Neutral : 3
};

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


	var rndx, rndy, rnds, o, cache = new Array(resX);
	for(var x = 1; x < resX; x++) {
		cache[x] = new Array(resY);
		for(var y = 1; y < resY; y++) {
			rndx = ((x * avgGapX) - (rndGapX/2) + (Math.random() * rndGapX)) | 0;
			rndy = ((y * avgGapY) - (rndGapY/2) + (Math.random() * rndGapY)) | 0;
			rnds = (avgSize - (rndSize / 2) + (Math.random() * rndSize)) | 0;
			o = new Planets.Renderable.Planet({x: rndx, y: rndy}, rnds, Planets.GeneratePlanetName());
			game.push(o);
			game.bgPush(o);

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

			o.spawnShip(game, Fraction.Player);
			o.spawnShip(game, Fraction.Player);
			o.spawnShip(game, Fraction.Player);
			o.spawnShip(game, Fraction.Player);
			o.spawnShip(game, Fraction.Enemy);
			o.spawnShip(game, Fraction.Enemy);
		}
	}
}

Planets.GeneratePlanetName = function() {
	//http://de.wikipedia.org/wiki/Liste_von_Sternennamen	:-)
	var prefix = ["Alpha", "Beta", "Zeta", "Epsilon", "Pi", "Mon", "Mir", "Psi", "Rho", "Omikron",
				  "Sigma", "Xi", "Cor"];
	var posfix = ["Majoris", "Minoris", "Indi", "Gamma", "Cephei", "A", "B", "C", "Ceti", "Delta",
				  "Tauri", "Capricorni", "Lyrae"];
	var pnames =   ["Mensae", "Pollux", "Ursae", "Leonis", "Virginis", "Draconis", "Kappa", "Coronae",
					"Herculis", "Arae", "Pegasi", "Delphini", "Aquarii", "Orionis", "Arietis", "Librae",
					"Beteigeuze", "Sol"];

	var name = prefix[ (Math.random() * prefix.length) | 0] + " ";
		name+= pnames[ (Math.random() * pnames.length) | 0] + " ";
		name+= posfix[ (Math.random() * posfix.length) | 0];

	return name;
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

	var tdelta = Date.now() - this.start;
		tdelta = this.speed * this.direction * tdelta;
		this.current = this.a + tdelta;
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

/***********************************************************************
 * Game
 **********************************************************************/

Planets.Main = function(w, h) { 
	this.renderList = [];
	this.slotList = [];
	this.bgRenderList = [];
	this.bgSlotList = [];

	this.w = w; this.h = h;			//logical height/width


	this.interval;
	this.lastUpdate = this.firstUpdate = Date.now();


	this.selected = null;

	if(debug) {
		this.fpsTimer = Date.now();
		this.renderTime = 0;
		this.updateTime = 0;
		this.updateCounter = 0;

		this.lastUpdateFPS = 0;
		this.lastRenderFPS = 0;
		this.lastFullFPS = 0;

		this.potentialFPS = 0;

		this.fps = 0;
	}
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

	this.viewport = new Planets.Viewport(this, this.w, this.h);
	this.key = new Planets.Keymap();
	this.mouse = new Planets.Mouse(this, this.viewport);

	Planets.Build(this, this.viewport);
}

Planets.Main.prototype.start = function() {
	this.interval = setInterval(this.loop.bind(this), 20);
}

Planets.Main.prototype.stop = function() {
	clearInterval(this.interval);
}

Planets.Main.prototype.push = function(obj) {
	if(this.slotList.length != 0) {
		obj.renderIndex = this.slotList.pop();
		this.renderList[obj.renderIndex] = obj;
		return;
	}
	obj.renderIndex = this.renderList.length;
	this.renderList[obj.renderIndex] = obj;
}

Planets.Main.prototype.bgPush = function(obj) {
	if(this.bgSlotList.length != 0) {
		obj.bgRenderIndex = this.bgSlotList.pop();
		this.bgRenderList[obj.bgRenderIndex] = obj;
		return;
	}
	obj.bgRenderIndex = this.bgRenderList.length;
	this.bgRenderList[obj.bgRenderIndex] = obj;
}

Planets.Main.prototype.remove = function(obj) {
	this.renderList[obj.renderIndex] = null;
	this.slotList.push(obj.renderIndex);
}

Planets.Main.prototype.bgRemove = function(obj) {
	this.bgRenderList[obj.bgRenderIndex] = null;
	this.bgSlotList.push(obj.bgRenderIndex);
}

Planets.Main.prototype.loop = function() {

	var deltaTime = Date.now() - this.lastUpdate;
	if(deltaTime == 0) deltaTime = 1;
	this.lastUpdate = Date.now();
	var gameTime  = this.lastUpdate - this.firstUpdate;

	this.viewport.handleInput(this.mouse, this.key);
	this.viewport.clear();

	if(debug) {
		var timerUpdateStart = Date.now();
	}

	var i=0, l=this.renderList.length, bgl = this.bgRenderList.length;

	//always update foreground
	for(i = 0; i < l; i++)
		if(this.renderList[i] != null) 
			this.renderList[i].update(this, this.viewport, deltaTime, gameTime);

	//update background if needed
	if(this.viewport.bgUpdated)
		for(i = 0; i < bgl; i++)
			if(this.bgRenderList[i] != null) 
				this.bgRenderList[i].bgUpdate(this, this.viewport, deltaTime, gameTime);

	if(debug) {
		this.updateTime += (Date.now() - timerUpdateStart);
		var timerRenderStart = Date.now();
	}

	//always render foreground
	for(i = 0; i < l; i++)
		if(this.renderList[i] != null)
			this.renderList[i].render(this, this.viewport, this.viewport.context);

	//render background as needed
	if(this.viewport.bgUpdated)
		for(i = 0; i < bgl; i++)
			if(this.bgRenderList[i] != null)
				this.bgRenderList[i].bgRender(this, this.viewport, this.viewport.bgcontext);

	if(debug) {
		this.renderTime += Date.now() - timerRenderStart;
		this.updateCounter++;

		if(Date.now() - this.fpsTimer > 1000) {
			console.log("Update");
			this.fpsTimer = Date.now();
			this.lastUpdateFPS = Math.round(this.updateTime / this.updateCounter);
			this.lastRenderFPS = Math.round(this.renderTime / this.updateCounter);
			this.lastFullFPS = Math.round((this.renderTime + this.updateTime) / this.updateCounter);
			this.fps = this.updateCounter;
			this.updateCounter = 0;
			this.updateTime = this.renderTime = 0;
			this.potentialFPS = Math.round(1000 / this.lastFullFPS);
		}

		this.viewport.writeDebug(
			this.lastUpdateFPS,
			this.lastRenderFPS,
			this.lastFullFPS,
			this.fps,
			this.potentialFPS
			);
	}
}

/***********************************************************************
 * Viewport
 **********************************************************************/

Planets.Viewport = function(game, w, h) {
	this.game = game;

	this.w = w;						//logical width
	this.h = h;						//logical height

	this.vw = $(window).width();	//viewport height
	this.vh = $(window).height();	//viewport width

	this.jq_bgcanvas = $('<canvas></canvas>')
	.width(this.vw)
	.height(this.vh)
	.appendTo($('body'));

	this.bgcanvas = this.jq_bgcanvas.get(0);
	this.bgcanvas.width = this.vw;
	this.bgcanvas.height = this.vh;
	this.bgcontext = this.bgcanvas.getContext('2d');

	this.jq_canvas = $('<canvas></canvas>')
	.width(this.vw)
	.height(this.vh)
	.appendTo($('body'));

	this.canvas = this.jq_canvas.get(0);
	this.canvas.width = this.vw;
	this.canvas.height = this.vh;
	this.context = this.canvas.getContext('2d');

	this.offset = {x: 0, y: 0};

	this.moveSpeed = 4;		// Screen movement speed
	this.moveCorner = 30;	// Hot corner size

	this.bgUpdated = false;
}

Planets.Viewport.prototype.writeDebug = function(update, render, full, fps, pfps) {
	this.context.font = "10pt Lucida Console";
	this.context.fillStyle = "#ffffff";
	this.context.fillText("Update: " + update, 10 - this.offset.x, 20 - this.offset.y);
	this.context.fillText("Render: " + render, 10 - this.offset.x, 30 - this.offset.y);
	this.context.fillText("Combin: " + full,   10 - this.offset.x, 40 - this.offset.y);
	this.context.fillText("PotFPS: " + pfps,   10 - this.offset.x, 50 - this.offset.y);
	this.context.fillText("ReaFPS: " + fps,   10 - this.offset.x, 60 - this.offset.y);
	this.context.fill();
}

Planets.Viewport.prototype.clear = function() {
	if(this.bgUpdated) {
		//if the background has been updated, clear the
		//transformations, clear the canvas and apply
		//the new offsets
		this.context.setTransform(1, 0, 0, 1, 0, 0);
		this.context.clearRect(0, 0, this.vw, this.vh);
		this.context.translate(this.offset.x, this.offset.y);

		this.bgcontext.setTransform(1, 0, 0, 1, 0, 0);
		this.bgcontext.clearRect(0, 0, this.vw, this.vh);
		this.bgcontext.translate(this.offset.x, this.offset.y);
	} else {
		//nothing has changed - clear the foreground canvas (with regards to
		//the translated offsets)
		this.context.clearRect(0, 0, this.vw - this.offset.x, this.vh - this.offset.y);
	}
}

Planets.Viewport.prototype.circleVisible = function(x, y, r) {
	return true;
}

Planets.Viewport.prototype.rectVisible = function(x1, y1, x2, y2) {
	return true;
}

Planets.Viewport.prototype.handleInput = function(mouse, keyboard) {
	this.bgUpdated = false;
	this.handleMouse(mouse);
	this.handleKeydown(keyboard);
}

// Handle viewport offset when mouse is in hot corners
Planets.Viewport.prototype.handleMouse = function(mouse) {
	if(mouse.absolute.y < this.moveCorner) 	
		this.moveDown();
	if(mouse.absolute.y > this.vh - this.moveCorner) 
		this.moveUp();
	if(mouse.absolute.x < this.moveCorner) 
		this.moveLeft();
	if(mouse.absolute.x > this.vw - this.moveCorner) 
		this.moveRight();
}

// Handle viewport offset when arrow-keys are pressed
Planets.Viewport.prototype.handleKeydown = function(keyboard) {
	if(keyboard.keymap[Keys.UP]) 	this.moveUp();
	if(keyboard.keymap[Keys.DOWN]) 	this.moveDown();
	if(keyboard.keymap[Keys.LEFT])	this.moveLeft();
	if(keyboard.keymap[Keys.RIGHT])	this.moveRight();
}

// Viewport movement methods
Planets.Viewport.prototype.moveUp = function() {
		this.bgUpdated = true;
		this.offset.y -= this.moveSpeed;
		if(this.offset.y < this.vh - this.h) 
			this.offset.y = (this.vh - this.h);
}

Planets.Viewport.prototype.moveDown = function() {
		this.bgUpdated = true;
		this.offset.y += this.moveSpeed;
		if(this.offset.y > 0)
			this.offset.y = 0;
}

Planets.Viewport.prototype.moveLeft = function() {
		this.bgUpdated = true;
		this.offset.x += this.moveSpeed;
		if(this.offset.x > 0)
			this.offset.x = 0;
}

Planets.Viewport.prototype.moveRight = function() {
		this.bgUpdated = true;
		this.offset.x -= this.moveSpeed;
		if(this.offset.x < this.vw - this.w)
			this.offset.x = (this.vw - this.w);
}

/***********************************************************************
 * Mouse
 **********************************************************************/

Planets.Mouse = function(game, viewport) {
	this.game = game; 
	this.viewport = viewport;

	viewport.canvas.onmousemove = this.handler.bind(this);
	viewport.jq_canvas.mousewheel(this.wheelHandler.bind(this));
	viewport.jq_canvas.bind('mousedown', this.downHandler.bind(this));
	viewport.jq_canvas.bind('mouseup', this.upHandler.bind(this));

	//position including offset calculation
	this.position = {x: 0, y: 0};
	//absolute position (for fixed gui elements)
	this.absolute = {x: 0, y: 0};


	this.delta = 0;
	this.left = viewport.jq_canvas.offset().left;
	this.top  = viewport.jq_canvas.offset().top;
	this.currentDown = null;	// Element on which the mousebutton was pressed down
	this.down = false;
}

// Returns the delat and clears it (sets it to 0);
Planets.Mouse.prototype.getClearDelta = function() {
	var d = this.delta;
	this.delta = 0;
	return Math.round(d);
}

Planets.Mouse.prototype.handler = function(event) {
	this.absolute.x = event.pageX - this.left;
	this.absolute.y = event.pageY - this.top;
	this.position.x = this.absolute.x - this.viewport.offset.x;
	this.position.y = this.absolute.y - this.viewport.offset.y;
}

Planets.Mouse.prototype.wheelHandler = function(event, delta) {
	event.preventDefault();
	this.delta = delta;
}

Planets.Mouse.prototype.downHandler = function(event) {
	this.currentDown = this.game.selected;
	this.down = true;
}

Planets.Mouse.prototype.upHandler = function(event) {
	if( this.currentDown != null && 
		this.game.selected != null &&
		this.currentDown != this.game.selected) 
			this.currentDown.moveSelectedShips(this.game.selected, Fraction.Player);
	
	this.down = false;
	this.currentDown = null;
}

/***********************************************************************
 * Key bindings
 **********************************************************************/

Planets.Keymap = function() { 
	this.keymap = new Array(128);
	for(var i = 0; i < 128; i++)
		this.keymap[i] = false;

	window.onkeydown = this.handlerDown.bind(this);
	window.onkeyup = this.handlerUp.bind(this);
}

Planets.Keymap.prototype.handlerDown = function(event) {
	event.preventDefault();
	this.keymap[event.keyCode] = true;
}

Planets.Keymap.prototype.handlerUp = function(event) {
	event.preventDefault();
	this.keymap[event.keyCode] = false;
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
Planets.Renderable.prototype.render = function(game, viewport, context) { }
Planets.Renderable.prototype.bgRender = function(game, viewport, context) { }
Planets.Renderable.prototype.destroy = function() { }

/***********************************************************************
 * Planet
 **********************************************************************/

Planets.Renderable.Planet = function(position, radius, name) {
	this.name = name;
	this.position = position;
	this.radius = radius;
	this.color = Planets.Renderable.Planet.colors[(Math.random() * Planets.Renderable.Planet.colors.length) | 0];
	this.connections = [];
	this.mouseOver = false;

	//Properties for handling orbitting ships	
	this.ships = new Array(Fractions.length);
	this.shipCount = new Array(Fractions.length); 
	this.shipSelected = new Array(Fractions.length); 
	for(var i = 0; i < Fractions.length; i++) {
		this.ships[i] = [];
		this.shipCount[i] = 0;
		this.shipSelected[i] = 0;
	}

	//Ownership stuff
	this.ownerChangeStart = null;
	this.ownerApplicant = null;
	this.owner = Fraction.Neutral;
	Fractions[this.owner].planetCount++;
	this.spawnTimer = null;

	//Animation
	this.ownerAnimation = new Planets.Animation.Linear(0.2, 0.8, true, 1);

	//Some object indices
	this.renderIndex = this.bgRenderIndex = 0;

	//Properties of path preview
	this.path = null;
}
Planets.Renderable.Planet.colors = ["rgb(109,133,193)","rgb(173,116,109)","rgb(239,175,65)"];
Planets.Renderable.Planet.prototype = new Planets.Renderable();
Planets.Renderable.Planet.prototype.constructor = Planets.Renderable.Planet;

Planets.Renderable.Planet.prototype.connect = function(planet) {
	this.connections.push(planet);
}

Planets.Renderable.Planet.prototype.spawnShip = function(game, fraction) {
	var i = this.ships[fraction].length;
	var s = new Planets.Renderable.Ship(this, fraction);
	game.push(s.init());
	s.pIndex = i;
	s.attached = true;
	this.shipCount[fraction]++;
	this.ships[fraction][i] = s;
	return s;
}

Planets.Renderable.Planet.prototype.attachShip = function(ship) {
	var f = ship.getFraction();
	var i = this.ships[f].length;
	ship.pIndex = i;
	ship.attached = true;
	this.ships[f][i] = ship;
	this.shipCount[f]++;
}

Planets.Renderable.Planet.prototype.removeShip = function(ship) {
	if(!ship.attached) return;
	var f = ship.getFraction();
	this.ships[f][ship.pIndex].attached = false;
	this.ships[f][ship.pIndex] = null;
	this.shipCount[f]--;
}

Planets.Renderable.Planet.prototype.moveSelectedShips = function(target, fraction) {
	var path = Planets.Path(this, target);
	var len = this.ships[fraction].length, counter = 0;
	for(var i = 0; i < len; i++) {
		if(counter >= this.shipSelected[fraction]) return;
		if(this.ships[fraction][i] != null) {
			this.ships[fraction][i].moveTo(path);
			this.removeShip(this.ships[fraction][i]);
			counter++;
		}
	}
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
		if(this.shipCount[i] > 0) {
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
			if(Date.now() - this.ownerChangeStart >= ownershipChangeRate) {
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
	if(Date.now() - this.spawnTimer >= planetSpawnRate) {
		this.spawnTimer = Date.now();
		if(this.shipCount[this.owner] > planetSpawnMaxPresent) return;
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
		this.shipSelected[Fraction.Player] += game.mouse.getClearDelta();
		this.shipSelected[Fraction.Player] = 
			(this.shipSelected[Fraction.Player] < 0)? 0 : 
			(this.shipSelected[Fraction.Player] > this.shipCount[Fraction.Player])? this.shipCount[Fraction.Player] : this.shipSelected[Fraction.Player];
	
		//Preview possible path to this planet
		if(game.mouse.down && game.mouse.currentDown != this && !this.path)
			this.showPathPreview(Planets.Path(game.mouse.currentDown, this));
	} 

	if(this.path && (!this.mouseOver || !game.mouse.currentDown))
		this.hidePathPreview();

	this.checkOwnership();
	this.checkSpawn(game);
}

Planets.Renderable.Planet.prototype.render = function(game, viewport, context) {
	// Draw connections
	if(this.mouseOver && this.connections.length >= 0 && !this.path) {
		context.beginPath();
		context.lineWidth = 1;
		context.strokeStyle = "rgba(0, 0, 0, 0.3)";

		for(var i = 0; i < this.connections.length; i++)
			this.renderPath(context, this, this.connections[i]);

		context.stroke();

	} else if(this.path) {
		context.lineWidth = 2;
		context.beginPath();
		context.strokeStyle = "rgba(0, 0, 0, 0.3)";

		for(var i = 0; i < this.path.length - 1; i++)
			this.renderPath(context, this.path[i], this.path[i+1]);

		context.stroke();
	}

	//Draw ownership
	context.beginPath();
	context.lineWidth = 4;
	context.globalAlpha = (this.ownerApplicant)? this.ownerAnimation.next() : 0.5;
	context.strokeStyle = Fractions[this.owner].color;
	context.arc(this.position.x, this.position.y, 10, 0, PI2);
	context.stroke();
	context.globalAlpha = 1.0;

	//Draw UI
	if(this.mouseOver)
		this.renderStatusUI(context);

}

Planets.Renderable.Planet.prototype.renderStatusUI = function(context) {
	var x = this.position.x, y = this.position.y, r = this.radius;


	if(this.shipCount[Fraction.Player]) {
		context.beginPath();
		context.lineWidth = 12;

		// Selection dial background
		context.strokeStyle = "rgba(253,253,199, 0.2)";
		context.arc(x, y, r + 12, 0, PI2);
		context.stroke();

		// Selection dial foreground
		if(this.shipSelected) {
			context.beginPath();
			context.strokeStyle = this.color;
			context.globalAlpha = 0.5;
			context.arc(x, y, r + 12, 0, (this.shipSelected[Fraction.Player] / this.shipCount[Fraction.Player]) * PI2);
			context.stroke();	
			context.globalAlpha = 1;
		}

		// Draw text
		context.beginPath();
		context.fillStyle = "#ffffff";
		context.strokeStyle = "#000000";
		context.lineWidth = 1;
		context.font = 'bold 16pt Verdana';
		var str = this.shipSelected[Fraction.Player] + "/" + this.shipCount[Fraction.Player];
		var dim = context.measureText(str);
		context.textBaseline = "middle";

		context.fillText(str, x - (dim.width/2), y);
		context.strokeText(str, x - (dim.width/2), y);
	}

	//Draw planet name
	context.fillStyle = "#ffffff";
	context.strokeStyle = "#000000";
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

Planets.Renderable.Planet.prototype.bgRender = function(game, viewport, context) {
	var x = this.position.x, y = this.position.y, r = this.radius;

	var grdInner = context.createRadialGradient(x, y, 5, x, y, r);
	grdInner.addColorStop(0,"rgba(253,253,199, 1)");
	grdInner.addColorStop(1,this.color);
	//inner gradient
	var grdOuter = context.createRadialGradient(x, y, r, x, y, r << 1);
	grdOuter.addColorStop(0, "rgba(211,158,114,0.3)");
	grdOuter.addColorStop(1, "rgba(211,158,114,0.0)");

	//glow
	context.beginPath();
	context.fillStyle = grdOuter;
	context.arc(x, y, r << 1, 0, PI2);
	context.fill();

	//circle & inner
	context.beginPath();
	context.lineStyle = "#000000";
	context.lineWidth = 4;
	context.fillStyle = grdInner;
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
	//Randomize base speed to spread ship distribution.
	//This should be changed to st. that makes sense,
	//e.g. speed increase with age/
	//speed decrease with lower health points 
	this.speed = this.speed + ((Math.random() * 30) | 0);
}

Planets.Renderable.Ship.prototype = new Planets.Renderable();
Planets.Renderable.Ship.prototype.constructor = Planets.Renderable.Ship;
Planets.Renderable.Ship.prototype.orbit = null;
Planets.Renderable.Ship.prototype.speed = 120;

Planets.Renderable.Ship.prototype.init = function() {
	//Angle between the ship and the planet
	this.angle = (Math.random() * (1024)) | 0;
	//Distance between the ship and the planet surface
	this.offset = ((Math.random() * (30 - 10) ) + 10) | 0;

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

Planets.Renderable.Ship.prototype.update = function(game, viewport, deltaTime, gameTime) {
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
			}
			return;
		}

		var a = angulate(this.position,target.position);
		var speed = this.speed * (deltaTime / 1000);

		this.position.x = (this.position.x + speed * Planets.lookup.cos[a | 0]);
		this.position.y = (this.position.y + speed * Planets.lookup.sin[a | 0]);
	}
}

Planets.Renderable.Ship.prototype.moveTo = function(path) {
	if(path.length > 1) 
		for(var i = 1; i < path.length; i++)
			this.moveQ.push(path[i]);
}

Planets.Renderable.Ship.prototype.render = function(game, viewport, context) {
 	context.beginPath();    
 	context.fillStyle = Fractions[this.fraction].color;

 	context.save();
 	context.translate(this.position.x, this.position.y);
    context.rotate( ((PID1024) * this.angle) + (PID4) );
 	context.moveTo(0, 0);
 	context.bezierCurveTo(0, 4, 4, 4, 12, 0);
 	context.bezierCurveTo(4, -4, 0, -4, 0, 0);
	context.fill();

 	//if not in orbit or moving to target, draw the "engine exhaust"
	if(!this.orbit || this.currentMoveTarget) {
		context.beginPath();
		context.fillStyle = "rgba(255, 255, 255, 0.5)";
		context.arc(-2, 0, 2, 0, PI2);
		context.fill();
	}

	context.restore();
}

