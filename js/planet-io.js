/***********************************************************************
 * Viewport
 **********************************************************************/

Planets.Viewport = function(game, w, h) {
	this.game = game;

	this.w = w;						//logical width
	this.h = h;						//logical height

	this.vw = $(window).width();	//viewport height
	this.vh = $(window).height();	//viewport width

	$('body').css('background-color', Planets.const.viewportBackgroundColor);

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

	this.moveSpeed = Planets.const.scrollSpeed;		// Screen movement speed
	//this.moveCorner = Planets.const.hotCornerSize;	// Hot corner size
}

Planets.Viewport.prototype.clear = function() {
	if(this.game.bgLayer.isInvalid()) {
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
	if(x+r < this.offset.x || x-r > (this.vw - this.offset.x )) return false;
	if(y+r < this.offset.y || y-r > (this.vh - this.offset.y )) return false;
	return true;
}

Planets.Viewport.prototype.rectVisible = function(x1, y1, x2, y2) {
	if(x2 < this.offset.x || x1 > (this.vw - this.offset.x )) return false;
	if(y2 < this.offset.y || y1 > (this.vh - this.offset.y )) return false;
	return true;
}

Planets.Viewport.prototype.handleInput = function(mouse, keyboard, touch) {
	//this.bgUpdated = false;
	this.handleMouse(mouse);
	this.handleKeydown(keyboard);
}

// Handle viewport offset when mouse is in hot corners
Planets.Viewport.prototype.handleMouse = function(mouse) {
	// if(mouse.absolute.y < this.moveCorner) 	
	// 	this.moveDown();
	// if(mouse.absolute.y > this.vh - this.moveCorner) 
	// 	this.moveUp();
	// if(mouse.absolute.x < this.moveCorner) 
	// 	this.moveLeft();
	// if(mouse.absolute.x > this.vw - this.moveCorner) 
	// 	this.moveRight();

	mouse.dispatchEvents();
}

// Handle viewport offset when arrow-keys are pressed
Planets.Viewport.prototype.handleKeydown = function(keyboard) {
	if(keyboard.keymap[Keys.UP]) 	this.moveUp();
	if(keyboard.keymap[Keys.DOWN]) 	this.moveDown();
	if(keyboard.keymap[Keys.LEFT])	this.moveLeft();
	if(keyboard.keymap[Keys.RIGHT])	this.moveRight();

	if(keyboard.keymap[Keys.PAUSE]) this.game.stop();
}

// Viewport movement methods
Planets.Viewport.prototype.moveUp = function() {
		this.game.bgLayer.invalidate();
		this.offset.y -= this.moveSpeed;
		if(this.offset.y < this.vh - this.h) 
			this.offset.y = (this.vh - this.h);
}

Planets.Viewport.prototype.moveDown = function() {
		this.game.bgLayer.invalidate();
		this.offset.y += this.moveSpeed;
		if(this.offset.y > 0)
			this.offset.y = 0;
}

Planets.Viewport.prototype.moveLeft = function() {
		this.game.bgLayer.invalidate();
		this.offset.x += this.moveSpeed;
		if(this.offset.x > 0)
			this.offset.x = 0;
}

Planets.Viewport.prototype.moveRight = function() {
		this.game.bgLayer.invalidate();
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

	Planets.LocalEvent.add('over', viewport.w, viewport.h);
	Planets.LocalEvent.add('over_a', viewport.vw, viewport.vh);

	Planets.LocalEvent.subscribe('over_a', viewport.moveUp.bind(viewport), 
			0, 
			viewport.vh - Planets.const.hotCornerSize, 
			viewport.vw, 
			viewport.vh);
	Planets.LocalEvent.subscribe('over_a', viewport.moveDown.bind(viewport), 
			0, 
			0, 
			viewport.vw, 
			Planets.const.hotCornerSize);
	Planets.LocalEvent.subscribe('over_a', viewport.moveLeft.bind(viewport), 
			0, 
			0, 
			Planets.const.hotCornerSize, 
			viewport.vh);
	Planets.LocalEvent.subscribe('over_a', viewport.moveRight.bind(viewport), 
			viewport.vw - Planets.const.hotCornerSize, 
			0, 
			viewport.vw, 
			viewport.vh);

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

Planets.Mouse.prototype.dispatchEvents = function() {
	Planets.LocalEvent.trigger('over', this.position.x, this.position.y);
	Planets.LocalEvent.trigger('over_a', this.absolute.x, this.absolute.y);
}

// Returns the delat and clears it (sets it to 0);
Planets.Mouse.prototype.getClearDelta = function() {
	if( (this.delta < 1 && this.delta > 0) || (this.delta < 0 && this.delta > -1) ) return 0;
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
	this.delta += Planets.const.deltaDamping * delta;
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

Planets.Keymap = function(game, viewport) { 
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
 * Generic Quad (better: Rect :-) ) tree implementation
 **********************************************************************/

Planets.LocalEvent = {

	events : {},

	add : function(name, w, h) {
		this.events[name] = new Planets.QuadTree(0, 0, w, h, 4);
	},

	trigger : function(name, x, y) {
		if(!(name in this.events)) return;
		this.events[name].trigger(x, y);
	},

	subscribe : function(name, callback, x1, y1, x2, y2) {
		this.events[name].addElement(callback, x1, y1, x2, y2);
	}
}

/***********************************************************************
 * Generic Quad (better: Rect :-) ) tree implementation
 **********************************************************************/

Planets.QuadTree = function(x1, y1, x2, y2, depth) { 
	this.depth = 1; //depth;
	this.root = new Planets.QuadTree.Node(x1, y1, x2, y2);
}

Planets.QuadTree.prototype.addElement = function(callback, x1, y1, x2, y2) {
	(typeof callback == "object") || (callback = {
			callback : callback, x1 : x1,
			y1 : y1, x2 : x2, y2 : y2 });
	this.root.addElement(callback, this.depth);
}

Planets.QuadTree.prototype.trigger = function(x, y) {
	var args = Array.prototype.slice.call(arguments);
	x = args.shift(); y = args.shift();
	this.root.trigger(x, y, args);
}

Planets.QuadTree.Node = function(x1, y1, x2, y2) {
	//Centerpoint
	this.x = x1 + ( (x2 - x1) / 2 );
	this.y = y1 + ( (y2 - y1) / 2 );

	this.x1 = x1; this.x2 = x2; 
	this.y1 = y1; this.y2 = y2;

	this.childrenTL = null;
	this.childrenTLC = 0;
	this.childrenTR = null;
	this.childrenTRC = 0;
	this.childrenBL = null;
	this.childrenBLC = 0;
	this.childrenBR = null;
	this.childrenBRC = 0;

	this.leaves = null;
}

//Add receiver. Receivers should look like this:
//{ x1: X, y1 : Y, x2 : X, y2 : Y, callback = function() ... }
Planets.QuadTree.Node.prototype.addElement = function(node, depth) {
	if(depth == 0) {
		this.leaves || (this.leaves = Store.create());
		this.leaves.add(node);
		return;
	}

	depth--;

	if(node.x1 <= this.x && node.y1 <= this.y && node.x2 > this.x1 && node.y2 > this.y1) {
		this.childrenTL || (this.childrenTL = new Planets.QuadTree.Node(this.x1, this.y1, this.x, this.y));
		this.childrenTLC++;
		this.childrenTL.addElement(node, depth);
	}

	if(node.x1 <= this.x2 && node.y1 <= this.y && node.x2 > this.x && node.y2 > this.y1) {
		this.childrenTR || (this.childrenTR = new Planets.QuadTree.Node(this.x, this.y1, this.x2, this.y));
		this.childrenTRC++;
		this.childrenTR.addElement(node, depth);
	}

	if(node.x1 <= this.x && node.y1 <= this.y2 && node.x2 > this.x1 && node.y2 > this.y) {
		this.childrenBL || (this.childrenBL = new Planets.QuadTree.Node(this.x1, this.y, this.x, this.y2));
		this.childrenBLC++;
		this.childrenBL.addElement(node, depth);
	}

	if(node.x1 <= this.x2 && node.y1 <= this.y2 && node.x2 > this.x && node.y2 > this.y) {
		this.childrenBR || (this.childrenBR = new Planets.QuadTree.Node(this.x, this.y, this.x2, this.y2));
		this.childrenBRC++;		
		this.childrenBR.addElement(node, depth);
	}


}

Planets.QuadTree.Node.prototype.trigger = function(x, y, args) {
	if(this.leaves && this.leaves.size) {
		this.leaves.each(function() {
			if(this.x1 <= x && this.x2 > x && 
			   this.y1 <= y && this.y2 > y) {
				this.callback.apply(this, args);
			}
		});
	} else {
		if(x <= this.x && y <= this.y) {
			this.childrenTLC && this.childrenTL.trigger(x, y, args);
		} else if(x > this.x && y <= this.y) {
			this.childrenTRC && this.childrenTR.trigger(x, y, args);
		} else if(x <= this.x && y > this.y) {
			this.childrenBLC && this.childrenBL.trigger(x, y, args);
		} else {
			this.childrenBRC && this.childrenBR.trigger(x, y, args);
		}
	}
}




