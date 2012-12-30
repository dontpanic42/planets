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
	return 1024 - ((a < 0)? a + 1024 : (a > 1024)? 1024 - a : a);
}

var Keys = {
	LEFT : 37,
	RIGHT : 39,
	UP : 40,
	DOWN : 38
};

Planets.Main = function(w, h) { 
	this.renderList = [];
	this.slotList = [];

	this.w = w; this.h = h;

	this.jq_canvas = $('<canvas></canvas>')
	.width(w)
	.height(h)
	.appendTo($('body'));

	this.canvas = this.jq_canvas.get(0);
	this.canvas.width = w;
	this.canvas.height = h;
	this.context = this.canvas.getContext('2d');

	this.interval;
	this.lastUpdate = this.firstUpdate = (new Date()).getTime();

	this.offset = {x: 0, y: 0};

	this.selected = null;
}

Planets.Main.prototype.init = function() {
	Planets.lookup = {sin: [], cos: []};
	var ang;
	for(var i = 0; i < 1024; i++) {
		ang = 2 * Math.PI * i / 1024;
		Planets.lookup.cos[i] = Math.cos(ang);
		Planets.lookup.sin[i] = Math.sin(ang);
	}

	this.keymap = new Planets.Keymap();
	this.keymap.attach(Keys.LEFT, this.moveLeft.bind(this));
	this.keymap.attach(Keys.RIGHT, this.moveRight.bind(this));
	this.keymap.attach(Keys.UP, this.moveUp.bind(this));
	this.keymap.attach(Keys.DOWN, this.moveDown.bind(this));

	this.mouse = new Planets.Mouse(this);
}

Planets.Main.prototype.moveLeft = function(e) { this.offset.x-=5; }
Planets.Main.prototype.moveRight = function(e) { this.offset.x+=5; }
Planets.Main.prototype.moveDown = function(e) { this.offset.y-=5; }
Planets.Main.prototype.moveUp = function(e) { this.offset.y+=5; }

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

Planets.Main.prototype.remove = function(obj) {
	this.renderList[obj.renderIndex] = null;
	this.slotList.push(obj.renderIndex);
}

Planets.Main.prototype.loop = function() {

	var deltaTime = (new Date()).getTime() - this.lastUpdate;
	if(deltaTime == 0) deltaTime = 1;
	this.lastUpdate = (new Date()).getTime();
	var gameTime  = this.lastUpdate - this.firstUpdate;

	this.context.clearRect(0, 0, this.w, this.h);
	var i=0, l=this.renderList.length;
	// console.time("Update");
	for(i = 0; i < l; i++)
		if(this.renderList[i] != null) 
			this.renderList[i].update(this, deltaTime, gameTime);
	// console.timeEnd("Update");
	// console.time("Render");
	for(i = 0; i < l; i++)
		if(this.renderList[i] != null)
			this.renderList[i].render(this, this.context);
	// console.timeEnd("Render");
}

/***********************************************************************
 * Mouse
 **********************************************************************/

Planets.Mouse = function(game) {
	this.game = game; 


	game.canvas.onmousemove = this.handler.bind(this);
	game.jq_canvas.mousewheel(this.wheelHandler.bind(this));
	game.jq_canvas.bind('mousedown', this.downHandler.bind(this));
	game.jq_canvas.bind('mouseup', this.upHandler.bind(this));

	this.position = {x: 0, y: 0};
	this.delta = 0;
	this.left = game.jq_canvas.offset().left;
	this.top  = game.jq_canvas.offset().top;
	this.currentDown = null;
}

Planets.Mouse.prototype.handler = function(event) {
	this.position.x = event.pageX - this.left - this.game.offset.x;
	this.position.y = event.pageY - this.top - this.game.offset.y;
}

Planets.Mouse.prototype.wheelHandler = function(event, delta) {
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
	this.keymap = [];
	window.onkeypress = this.handler.bind(this);
}

Planets.Keymap.prototype.handler = function(event) {
	if(this.keymap[event.keyCode])
		this.keymap[event.keyCode](event);
}

Planets.Keymap.prototype.attach = function(keyCode, callback) {
	this.keymap[keyCode] = callback;
}

Planets.Keymap.prototype.remove = function(callback) {
	for(var i = 0; i < this.keymap.length; i++) {
		if(this.keymap[i] == callback) {
			delete this.keymap[i];
			return;
		}
	}
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
Planets.Renderable.prototype.update = function(game, gameTime, deltaTime) { }
Planets.Renderable.prototype.render = function(game, context) { }
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
Planets.Renderable.Planet.colors = ["rgb(109,133,193","rgb(173,116,109)","rgb(239,175,65)"];
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
			console.log("Sending mighty battleship", target);
			counter++;
		}
	}
}

Planets.Renderable.Planet.prototype.update = function(game, deltaTime, gameTime) {
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

Planets.Renderable.Planet.prototype.render = function(game, context) {
	var x = this.position.x + game.offset.x, y = this.position.y + game.offset.y, r = this.radius;
	//outer gradient
	// x0	The x-coordinate of the starting circle of the gradient
	// y0	The y-coordinate of the starting circle of the gradient
	// r0	The radius of the starting circle
	// x1	The x-coordinate of the ending circle of the gradient
	// y1	The y-coordinate of the ending circle of the gradient
	// r1	The radius of the ending circle
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

			var x2 = tmp.x + game.offset.x, y2 = tmp.y + game.offset.y;

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

Planets.Renderable.Ship.prototype.update = function(game, deltaTime, gameTime) {
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
		if(distance(this.position, target.position) < (target.radius + 20)) {
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
				//only remove ship if it was attached in the first place...
				this.orbit.removeShip(this);
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

Planets.Renderable.Ship.prototype.render = function(game, context) {
 	var x = game.offset.x + this.position.x, y = game.offset.y + this.position.y;


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
		context.fillStyle = "rgba(255, 255, 255, 0.5";
		context.arc(
				-2, 0, 2, 0, PI2
			);
		context.fill();
	}

	context.setTransform(1, 0, 0, 1, 0, 0);


}

