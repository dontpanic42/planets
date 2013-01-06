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
	this.moveCorner = Planets.const.hotCornerSize;	// Hot corner size

	// this.bgUpdated = false;
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
	this.delta += delta;
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