var distance  = function(position1, position2) {
	var x2 = position2.x,
		y2 = position2.y;
	return Math.sqrt((x2 -= position1.x) * x2 + (y2 -= position1.y) * y2);
}

var angulate = function(position1, position2) {
	var a = Math.atan2(-(position2.y-position1.y), (position2.x-position1.x)) * (1024/PI2);
	return 1024 - ((a < 0)? a + 1024 : a);
}

var angulate360 = function(position1, position2) {
	var a = Math.atan2(-(position2.y-position1.y), (position2.x-position1.x)) * (360/PI2);
	return 360 - ((a < 0)? a + 360 : a);
}

Array.prototype.init = function(value) {
	for(var i = 0; i < this.length; i++)
		this[i] = value;
	return this;
}

Array.prototype.random = function() {
	return this[(Math.random() * this.length) | 0];
}

Planets.GeneratePlanetName = function() {
	return Planets.const.planetNames.prefix[ 
			(Math.random() * Planets.const.planetNames.prefix.length) | 0] + " " +
		Planets.const.planetNames.names[
			(Math.random() * Planets.const.planetNames.names.length) | 0] + " " +
		Planets.const.planetNames.postfix[ 
			(Math.random() * Planets.const.planetNames.postfix.length) | 0];
}

var Store = {

	uidIndex : 0,

	//Call with number parameter to get an array
	//of stores with the parameter as length.
	//Call with object as parameter to extend
	//that object
	create : function(objOrCount) { 

		if(typeof objOrCount == "number") {
			var ar = new Array(objOrCount);
			for(var i = 0; i < objOrCount; i++)
				ar[i] = Store.create();
			return ar;
		}

		var self = this;

		return $.extend(((typeof obj == "object")? obj : {}), {
			slots : [],
			uid : self.uidIndex++,
			length : 0,
			size : 0,

			add : function(element) {
				if(this.slots.length > 0) {
					var pi = this.slots.pop();
					if(!element.storeIndex) element.storeIndex = [];
					element.storeIndex[this.uid] = pi;
					this[pi] = element;
				} else {
					if(!element.storeIndex) element.storeIndex = [];
					element.storeIndex[this.uid] = this.length;
					this[this.length] = element;
					this.length++;
				}

				this.size++;
				return element.storeIndex[this.uid];
			},

			remove : function(element) {
				if(!element.storeIndex || !(this.uid in element.storeIndex)  || element.storeIndex[this.uid] == -1) {
					console.log("Store element never added to store?");
					return;
				}

				var pi = element.storeIndex[this.uid];
				element.storeIndex[this.uid] = -1;
				this[pi] = null;
				this.slots.push(pi);

				this.size--;
			},

			contains : function(element) {
				return !!(element.storeIndex && 
						this.uid in element.storeIndex &&
						element.storeIndex[this.uid] != -1);
			},

			count : function() {
				return this.size;
			},

			each : function(callback) {
				if(!this.size) return;
				var args = Array.prototype.slice.call(arguments);
				var call = args.shift();

				for(var i = 0; i < this.length; i++) {
					if(this[i] == null) continue;
					call.apply(this[i], args);
				}
			},

			//Returns "times" different objects
			times : function(callback, times) {
				var times = Math.min(this.size, times);
				if(times == 0) return;

				for(var i = 0; i < this.length; i++) {
					if(!this[i]) continue;
					if(times-- <= 0) return;
					callback.apply(this[i], []);
				}
			},

			eachApply : function(callback, args) {
				if(!this.size) return;
				for(var i = 0; i < this.length; i++) {
					if(this[i] == null) continue;
					callback.apply(this[i], args);
				}
			},

			empty : function() {
				return !this.size;
			},

			random : function() {
				//This isn't perfect but since it's only used
				//to get random enemys, it will be enough.
				if(!this.size) return null;
				var seed = (Math.random() * this.length) | 0;
				while(true) {
					if(this[seed])
						return this[seed];
					if(++seed >= this.length)
						seed = 0;
				}
			}
		});

	}

};

var RenderLayer = {

	create : function(game, context) {
		var self = this;
		var store = Store.create();
		return $.extend(Store.create(), {
			invalid : true,

			fnUpdate : {},
			fnRender : {},

			invalidate : function() {
				this.invalid = true;
				return this;
			},

			isInvalid : function() {
				return this.invalid;
			},

			update : function() {
				if(!this.invalid) return this;
				var args = arguments, self = this;

				this.each(function() {
					var fn = self.fnUpdate[this.storeIndex[self.uid]];
					this[fn].apply(this, args);
				});

				return this;
			},

			render : function() {
				if(!this.invalid) return this;
				var args = arguments, self = this;

				this.each(function() {
					var fn = self.fnRender[this.storeIndex[self.uid]];
					this[fn].apply(this, args);
				});

				this.invalid = false;
				return this;
			},

			include : function(element, updateFn, renderFn) {
				var i = this.add(element);
				if(!updateFn) var updateFn = "update";
				if(!renderFn) var renderFn = "render";
				this.fnUpdate[i] = updateFn;
				this.fnRender[i] = renderFn;

				return this;
			}

		});
	}
};


var PreRender = {

	createRotated : function(w, h, renderCallback, args) {
		return ({

			c : null,

			w : 0,
			h : 0,
			offsetX : 0,
			offsetY : 0,

			init : function(w, h, renderCallback, args) {

				this.c = document.createElement("canvas");
				this.c.width = w * 360;
				this.c.height = this.h = h;
				this.w = w;
				var ctx = this.c.getContext("2d");

				args = [ctx, 0].concat(args)
				for(var i = 0; i < 360; i++) {
					args[1] = (i/360) * PI2;
					ctx.save();
					ctx.translate(i * w, 0);
					renderCallback.apply(this, args);
					ctx.restore();
				}

				this.offsetX = (w/2) | 0;
				this.offsetY = (h/2) | 0;

				return this;

			},

			put : function(context, x, y, angle) {
				angle |= 0;
				if(angle >=  360) angle -= 360;

				context.drawImage(
					this.c, 
					this.w * angle, 
					0, 
					this.w, 
					this.h, x - this.offsetX, 
					y - this.offsetY, 
					this.w, 
					this.h);
			}

		}).init(w, h, renderCallback, args);
	}
}

var DebugOutput = {
	fpsTimer : {
		fpsTimer : Date.now(),
		renderTime : 0,
		updateTime : 0,
		updateCounter : 0,

		updateStartTimer : 0,
		renderStartTimer : 0,

		lastUpdateFPS : 0,
		lastRenderFPS : 0,
		lastFullFPS : 0,

		potentialFPS : 0,

		fps : 0,

		updateStart : function() { 
			this.updateStartTimer = Date.now();
		},
		updateEnd : function() { 
			this.updateTime += (Date.now() - this.updateStartTimer);
		},
		renderStart : function() { 
			this.renderStartTimer = Date.now();
		},
		renderEnd : function() { 
			this.renderTime += Date.now() - this.renderStartTimer;
			this.updateCounter++;
		},

		show : function() { 
			if(Date.now() - this.fpsTimer > 1000) {
				this.fpsTimer = Date.now();
				this.lastUpdateFPS = Math.round(this.updateTime / this.updateCounter);
				this.lastRenderFPS = Math.round(this.renderTime / this.updateCounter);
				this.lastFullFPS = Math.round((this.renderTime + this.updateTime) / this.updateCounter);
				this.fps = this.updateCounter;
				this.updateCounter = 0;
				this.updateTime = this.renderTime = 0;
				this.potentialFPS = Math.round(1000 / this.lastFullFPS);
			}

			DebugOutput.write("Update", this.lastUpdateFPS);
			DebugOutput.write("Render", this.lastRenderFPS);
			DebugOutput.write("Combined", this.lastFullFPS);
			DebugOutput.write("fps (c)", this.fps);
			DebugOutput.write("fps (f)", this.potentialFPS);
		}
	},

	write : function(name, value) {
		this.towriteName.push("" + name);
		this.towriteValue.push("" + value);
	},

	towriteName : [],
	towriteValue: [],

	flush : function(viewport, context) { 
		if(this.towriteName.length == 0) return;
		var yoffset = 20 - viewport.offset.y;
		var x1 = 10 - viewport.offset.x,
			x2 = 90 - viewport.offset.x;

		context.beginPath();
		context.font = "10pt Lucida Console";
		context.fillStyle = "#ffffff";
		for(var i = 0; i < this.towriteName.length; i++) {
			context.fillText(this.towriteName[i],  x1, yoffset + (15 * i));
			context.fillText(this.towriteValue[i], x2, yoffset + (15 * i));
		}
		context.fill();

		this.towriteName = [];
		this.towriteValue = [];
	}
}