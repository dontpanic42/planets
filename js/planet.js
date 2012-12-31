var Planets = {};
var PI2 = Math.PI * 2;
var PID4 = PI2 / 4;
var PID1024 = PI2 / 1024;
var PID180 = 180 / (Math.PI);

var distance  = function(position1, position2) {
	var x2 = position2.x,
		y2 = position2.y;
	return Math.sqrt((x2 -= position1.x) * x2 + (y2 -= position1.y) * y2);
}

var angulate = function(position1, position2) {
	var a = Math.atan2(-(position2.y-position1.y), (position2.x-position1.x)) * (512/Math.PI);
	return 1024 - ((a < 0)? a + 1024 : a);
}

var Keys = {
	LEFT : 37,
	RIGHT : 39,
	UP : 40,
	DOWN : 38
};

/***********************************************************************
 * Glaxy Builder
 **********************************************************************/

Planets.Build = function(game, viewport) {
	var avgGapX = 400;
	var avgGapY = 400;
	var rndGapX = 200;
	var rndGapY = 160;
	var avgSize = 40;
	var rndSize = 40;

	var w = viewport.w, h = viewport.h;

	var resX = (w / (avgGapX)) | 0;
	var resY = (h / (avgGapY)) | 0;

	console.log(resX, resY);

	var rndx, rndy, rnds, o, cache = new Array(resX);
	for(var x = 1; x < resX; x++) {
		cache[x] = new Array(resY);
		for(var y = 1; y < resY; y++) {
			rndx = ((x * avgGapX) - (rndGapX/2) + (Math.random() * rndGapX)) | 0;
			rndy = ((y * avgGapY) - (rndGapY/2) + (Math.random() * rndGapY)) | 0;
			rnds = (avgSize - (rndSize / 2) + (Math.random() * rndSize)) | 0;
			o = new Planets.Renderable.Planet({x: rndx, y: rndy}, rnds);
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

			o.spawnShip(game);
			o.spawnShip(game);
			o.spawnShip(game);
			o.spawnShip(game);
		}
	}
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
	this.lastUpdate = this.firstUpdate = (new Date()).getTime();


	this.selected = null;
}

Planets.Main.prototype.init = function() {
	//create lookup table for sin/cos angles
	//default is 1024 steps (1°=360/1024)
	Planets.lookup = {sin: [], cos: []};
	var ang;
	for(var i = 0; i < 1024; i++) {
		ang = 2 * Math.PI * i / 1024;
		Planets.lookup.cos[i] = Math.cos(ang);
		Planets.lookup.sin[i] = Math.sin(ang);
	}

	this.key = new Planets.Keymap();
	this.viewport = new Planets.Viewport(this.key, this, this.w, this.h);
	this.mouse = new Planets.Mouse(this, this.viewport);

	Planets.Build(this, this.viewport);
}

Planets.Main.prototype.start = function() {
	this.interval = setInterval(this.loop.bind(this), 3);
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

	this.viewport.handleInput(this.mouse);
	this.viewport.clear();

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

	//always render foreground
	for(i = 0; i < l; i++)
		if(this.renderList[i] != null)
			this.renderList[i].render(this, this.viewport, this.viewport.context);

	//render background as needed
	if(this.viewport.bgUpdated)
		for(i = 0; i < bgl; i++)
			if(this.bgRenderList[i] != null)
				this.bgRenderList[i].bgRender(this, this.viewport, this.viewport.bgcontext);
}

/***********************************************************************
 * Viewport
 **********************************************************************/

Planets.Viewport = function(keyboard, game, w, h) {
	this.key = keyboard;
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

	this.moveSpeed = 5;		// Screen movement speed
	this.moveCorner = 20;	// Hot corner size

	this.bgUpdated = false;
}

Planets.Viewport.prototype.clear = function() {
	this.context.clearRect(0, 0, this.vw, this.vh);
	if(this.bgUpdated)
		this.bgcontext.clearRect(0, 0, this.vw, this.vh);
}

Planets.Viewport.prototype.circleVisible = function(x, y, r) {
	return true;
}

Planets.Viewport.prototype.rectVisible = function(x1, y1, x2, y2) {
	return true;
}

Planets.Viewport.prototype.handleInput = function(mouse) {
	this.bgUpdated = false;
	this.handleMouse(mouse);
	this.handleKeydown();
}

// Handle viewport offset when mouse is in hot corners
Planets.Viewport.prototype.handleMouse = function(mouse) {
	if(mouse.position.y + this.offset.y < this.moveCorner) 	{
		this.offset.y += this.moveSpeed;
		this.bgUpdated = true;
		if(this.offset.y > 0)
			this.offset.y = 0;
	}

	if(mouse.position.y + this.offset.y > this.vh - this.moveCorner) {
		this.offset.y -= this.moveSpeed;
		this.bgUpdated = true;
		if(this.offset.y < this.vh - this.h) 
			this.offset.y = (this.vh - this.h);
	}

	if(mouse.position.x + this.offset.x < this.moveCorner) {
		this.offset.x += this.moveSpeed;
		this.bgUpdated = true;
		if(this.offset.x > 0)
			this.offset.x = 0;
	}

	if(mouse.position.x + this.offset.x > this.vw - this.moveCorner) {
		this.offset.x -= this.moveSpeed;
		this.bgUpdated = true;
		if(this.offset.x < this.vw - this.w)
			this.offset.x = (this.vw - this.w);
	}
}

// Handle viewport offset when arrow-keys are pressed
Planets.Viewport.prototype.handleKeydown = function() {
	if(this.key.keymap[Keys.UP]) 	{
		this.bgUpdated = true;
		this.offset.y -= this.moveSpeed;
		if(this.offset.y < this.vh - this.h) 
			this.offset.y = (this.vh - this.h);
	}

	if(this.key.keymap[Keys.DOWN]) {
		this.bgUpdated = true;
		this.offset.y += this.moveSpeed;
		if(this.offset.y > 0)
			this.offset.y = 0;
	}

	if(this.key.keymap[Keys.LEFT])	{
		this.bgUpdated = true;
		this.offset.x -= this.moveSpeed;
		if(this.offset.x < this.vw - this.w)
			this.offset.x = (this.vw - this.w);
	}

	if(this.key.keymap[Keys.RIGHT])	{
		this.bgUpdated = true;
		this.offset.x += this.moveSpeed;
		if(this.offset.x > 0)
			this.offset.x = 0;
	}
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

	this.position = {x: 0, y: 0};
	this.delta = 0;
	this.left = viewport.jq_canvas.offset().left;
	this.top  = viewport.jq_canvas.offset().top;
	this.currentDown = null;
}

Planets.Mouse.prototype.handler = function(event) {
	this.position.x = event.pageX - this.left - this.viewport.offset.x;
	this.position.y = event.pageY - this.top - this.viewport.offset.y;
}

Planets.Mouse.prototype.wheelHandler = function(event, delta) {
	event.preventDefault();
	this.delta = delta;
	//console.log(this.delta);
}

Planets.Mouse.prototype.downHandler = function(event) {
	this.currentDown = this.game.selected;
	console.log("down", this.currentDown);
}

Planets.Mouse.prototype.upHandler = function(event) {
	if( this.currentDown != null && 
		this.game.selected != null &&
		this.currentDown != this.game.selected) {
		this.currentDown.moveSelectedShips(this.game.selected);
		console.log("moving ships");
	}
	
	this.currentDown = null;
	console.log("up");
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

Planets.Renderable.prototype.scale = 1.0;
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

Planets.Renderable.Planet = function(position, radius) {
	this.position = position;
	this.radius = radius;
	this.color = Planets.Renderable.Planet.colors[(Math.random() * Planets.Renderable.Planet.colors.length) | 0];
	this.connections = [];
	this.mouseOver = false;
	this.ships = [];
	this.shipCount = 0;
	this.shipSelected = 0;
	console.log(this.color);
}
Planets.Renderable.Planet.colors = ["rgb(109,133,193)","rgb(173,116,109)","rgb(239,175,65)"];
Planets.Renderable.Planet.prototype = new Planets.Renderable();
Planets.Renderable.Planet.prototype.constructor = Planets.Renderable.Planet;

Planets.Renderable.Planet.prototype.connect = function(planet) {
	this.connections.push(planet)
}

Planets.Renderable.Planet.prototype.spawnShip = function(game) {
	var i = this.ships.length;
	var s = new Planets.Renderable.Ship(this);
	game.push(s.init());
	s.pIndex = i;
	s.attached = true;
	this.shipCount++;
	this.ships[i] = s;
	return s;
}

Planets.Renderable.Planet.prototype.attachShip = function(ship) {
	var i = this.ships.length;
	ship.pIndex = i;
	ship.attached = true;
	this.ships[i] = ship;
	this.shipCount++;
}

Planets.Renderable.Planet.prototype.removeShip = function(ship) {
	if(!ship.attached) return;
	this.ships[ship.pIndex].attached = false;
	this.ships[ship.pIndex] = null;
	this.shipCount--;
}

Planets.Renderable.Planet.prototype.moveSelectedShips = function(target) {
	var len = this.ships.length, counter = 0;
	for(var i = 0; i < len; i++) {
		if(counter >= this.shipSelected) return;
		if(this.ships[i] != null) {
			this.ships[i].moveTo(target);
			this.removeShip(this.ships[i]);
			counter++;
		}
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
		var delta = Math.round(game.mouse.delta);
		if(delta != 0) {
			this.shipSelected += delta;
			game.mouse.delta = 0;
		}
		this.shipSelected = (this.shipSelected < 0)? 0 : (this.shipSelected > this.shipCount)? this.shipCount : this.shipSelected;
	}
}

Planets.Renderable.Planet.prototype.render = function(game, viewport, context) {
	var x = this.position.x + viewport.offset.x, y = this.position.y + viewport.offset.y, r = this.radius;


	// Draw connections
	if(this.mouseOver && this.connections.length >= 0) {
		context.beginPath();
		context.lineWidth = 1;
		context.lineStyle = "rgba(0, 0, 0, 0.2)";

		for(var i = 0; i < this.connections.length; i++) {
			context.beginPath();

			//TO BE OPTIMIZED :-)
			var tmp = this.connections[i].position;
			var tmpr = this.connections[i].radius;

			var x2 = tmp.x + viewport.offset.x, y2 = tmp.y + viewport.offset.y;

			var a = angulate(this.position, tmp);
			var b = angulate(tmp, this.position);

			var xe = x2 + tmpr * Planets.lookup.cos[b | 0];
			var ye = y2 + tmpr * Planets.lookup.sin[b | 0];


			var xa = x + r * Planets.lookup.cos[a | 0];
			var ya = y + r * Planets.lookup.sin[a | 0];


			context.moveTo(xa, ya);
			context.lineTo(xe, ye);
			context.stroke();
		}
	}

	if(this.mouseOver) {
		context.beginPath();
		context.fillStyle = "#000000";
		var dim = context.measureText("Fleet: 0");
		context.fillText("Fleet: " + this.shipCount, x - (dim.width/2), y);

		var dim = context.measureText("Selected: 0");
		context.fillText("Selected: " + this.shipSelected, x -(dim.width/2), y + 10);
	}

}

Planets.Renderable.Planet.prototype.bgRender = function(game, viewport, context) {
	var x = this.position.x + viewport.offset.x, y = this.position.y + viewport.offset.y, r = this.radius;
	var grdInner = context.createRadialGradient(x, y, 5, x, y, r);
	grdInner.addColorStop(0,"rgba(253,253,199, 0.5)");
	grdInner.addColorStop(1,this.color);
	//inner gradient
	var grdOuter = context.createRadialGradient(x, y, r, x, y, r*2);
	grdOuter.addColorStop(0, "rgba(211,158,114,0.3)");
	grdOuter.addColorStop(1, "rgba(211,158,114,0.0)");

	//glow

	//glow
	context.beginPath();
	context.fillStyle = grdOuter;
	context.arc(
			x,
			y,
			r*2,
			0,
			PI2
		);
	context.fill();

	//circle
	context.beginPath();
	context.scale(this.scale, this.scale);
	context.lineStyle = "#000000";
	context.lineWidth = 4;
	context.fillStyle = grdInner;
	context.arc(
			x,
			y,
			r,
			0,
			PI2
		);
	context.stroke();
	context.fill();
}


/***********************************************************************
 * Ship
 **********************************************************************/

Planets.Renderable.Ship = function(planet) { 
	this.orbit = planet;
	this.position = {x: 0, y: 0};
	this.currentMoveTarget = null;
}
Planets.Renderable.Ship.prototype = new Planets.Renderable();
Planets.Renderable.Ship.prototype.constructor = Planets.Renderable.Ship;
Planets.Renderable.Ship.prototype.orbit = null;
Planets.Renderable.Ship.prototype.speed = 120;

Planets.Renderable.Ship.prototype.init = function() {
	this.angle = (Math.random() * (1024)) | 0;
	this.offset = ((Math.random() * (30 - 10) ) + 10) | 0;

	this.pIndex = 0; //index used in the planet's shiplist, not to be changed.
	this.attached = true;

	this.currentMoveTarget = null;
	this.moveQ = [];

	return this;
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

Planets.Renderable.Ship.prototype.moveTo = function(planet) {
	this.moveQ.push(planet);
}

Planets.Renderable.Ship.prototype.render = function(game, viewport, context) {
 	var x = viewport.offset.x + this.position.x, y = viewport.offset.y + this.position.y;


 	context.beginPath();    
 	context.fillStyle = '#000000';

 	context.translate(x, y);
 	x = y = 0;
    context.rotate( ((PID1024) * this.angle) + (PID4) );
 	context.moveTo(x, y);
 	context.bezierCurveTo(x, y + 4, x + 4, y + 4, x+12, y);
 	context.bezierCurveTo(x+4, y-4, x, y-4, x, y);
 	context.fill();

 	//if not in orbit or moving to target, draw the "engine exhaust"
	if(!this.orbit || this.currentMoveTarget) {
		context.beginPath();
		context.fillStyle = "rgba(255, 255, 255, 0.5)";
		context.arc(
				-2, 0, 2, 0, PI2
			);
		context.fill();
	}

	context.setTransform(1, 0, 0, 1, 0, 0);


}

