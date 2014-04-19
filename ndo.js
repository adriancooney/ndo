/**
 * Create a new generator procedure with immediate invocation.
 * @param  {generator} gen The generator function.
 * @param {...*}  Any arguments thereafter will be sent to the generator.
 * @return {Promise}  
 */
var ndo = function(gen) {
	if(typeof gen !== "function") throw new Error("Please supply a generator function to ndo.");
	
	// Create the generator
	var schedule = gen.apply(ndo, Array.prototype.slice.call(arguments, 1));

	// Create the return promise
	return new ndo.Promise(function(resolve, reject) {
		// Iterate over each value yielded
		(function iterate() {
			// Get the next yielded value
			var operation = schedule.next();

			// While there's still some juice in the generator, iterate
			if(!operation.done) {
				var value = operation.value,
					promise = null;

				// Account for concurrent promises, if so run all
				if(Array.isArray(value)) promise = Promise.all(value);
				else promise = value; // Otherwise, use returned promise

				// Iterate!
				promise.then(iterate).catch(reject);
			} else resolve(); // Process finished
		})();
	});
};

/**
 * Create an ndo procedure.
 *
 * Example:
 * 		// Create the procedure
 * 		ndo.procedure("wiggle", function*(box) {
 * 			for(var i = 0; i < 5; i++) {
 * 				yield ntranslate(box, -5, 0, 100);
 * 				yield ntranslate(box, 5, 0, 100);
 * 			}
 * 		});
 *
 * 		// The call the procedure with arguments;
 * 		ndo.run("wriggle", nget("#box"));
 *
 * 		// Call a procedure in another procedure
 * 		ndo.procedure("wobble", function*(box) {
 * 			yield ndo.run("wiggle", box);
 *
 * 			for(var i = 0; i < 5; i++) {
 * 				yield ntranslate(box, 0, -5);
 * 				yield ntranslate(box, 0, 5);
 * 			}
 * 		});
 * 
 * @param  {string} name Name of the procedure.
 * @param  {Generator} gen  Generator callback of procedure.
 */
ndo.procedure = function(name, gen) {
	ndo.procedures[name] = gen;
	window["n" + name] = ndo.run.bind(ndo, name);
};

/**
 * Run a defined procedure by name with arguments.
 * @param  {string} procedure Procedure name
 * @param  {...*}             Any argument will be supplied to the procedure.
 * @return {Promise}
 */
ndo.run = function(name) {
	var procedure = ndo.procedures[name];

	// Ensure procedure exists
	if(!procedure) throw new Error("Procedure '" + name + "' does not exist.");

	// Remove the name from the arguments and shove in the generator to the first index
	var args = Array.prototype.slice.call(arguments, 1);
	args.unshift(procedure);

	// Aply ndo with new arguments
	return ndo.apply(ndo, args);
};

/**
 * ndo procedure store.
 * @type {Object}
 */
ndo.procedures = {};

/**
 * Allow for flexible promise implementation as long as they conform to the ES6 spec.
 * @type {Promise}
 */
ndo.Promise = window.Future || window.Promise;

/*
 * ndo Helper functions.
 */

/**
 * Simple fallthrough function to convert number to CSS duration if required.
 * Example:
 * 	ndo.duration("1s") // -> "1s"
 * 	ndo.duration(1000) // -> "1000ms"
 * 	ndo.duration("1000ms") // -> "1000ms"
 * 
 * @return {object} {length (number), text (css transition)}
 */
ndo.duration = function(duration) {
	var defaults = { length: 300, text: "300ms" }; // Default transition duration

	if(typeof duration === "number") return { length: duration, text: duration + "ms" };
	else if(typeof duration === "string") {

		var factors = {
			"s": 1000,
			"ms": 1
		};

		// Check to see if it matches any "s|ms" scheme otherwise return the defaults
		if(duration.match(/^(\d+)(m?s)$/)) return { length: parseInt(RegExp.$1) * factors[RegExp.$2], text: duration };
		else return defaults;
	} else return defaults;
};

/**
 * Parse the current state of an elements transform.
 * @param  {HTMLElement} elem 
 * @return {object}      {transform{x, y}, scale{factor, x, y}, rotate{angle}, skew{x, y}}
 */
ndo.parseState = function(elem) {
	var state = {
			translate: {x: undefined, y: undefined},
			rotate: undefined,
			scale: { x: undefined, y: undefined },
			skew: { x: undefined, y: undefined}
		},
		prefix = "webkit",
		transform = elem.style[prefix + "Transform"];

	transform.replace(/(\w+)\(([^\)]+)\)/g, function(transform, fn, value) {
		switch(fn) {
			case "translate":
				var coords = value.split(",").map(function(v) { return parseInt(v.trim()); });
				state.translate.x = coords[0];
				state.translate.y = coords[1];
			break;

			case "rotate":
				state.rotate = parseInt(value);
			break;

			case "scale": case "skew":
				var split = value.split(","), x, y;
				if(split.length > 1) {
					values = split.map(function(v) { return parseInt(v); });
					x = values[0];
					y = values[1];
				} else x = y = parseInt(value);

				state[fn].x = x;
				state[fn].y = y;
			break;
		}
	});

	return state;
};

/**
 * Add getters and setters to elemen for the translations, rotation etc.
 * Takes in the state object and effectively mirrors it on the element
 * with the "n" prefix. When one of these properties is requested, the
 * elements state is parsed again and returns the value with the getter, 
 * dynamically.
 * 
 * @param {HTMLElement} elem 
 */
ndo.addProperties = function(elem) {
	// Get the initial state object to mirror
	var state = ndo.parseState(elem);

	// Recursively iterate over the state object's levels
	(function defineProp(obj, host, path) {
		// Loop over each key with Object.keys for closure
		Object.keys(obj).forEach(function(key) {
			var value = obj[key],
				name = (path === "" ? "n" + key : key); // If this is the topmost level, prefix the property

			// If it's an object, go deeper (recur) with new path and host object
			if(typeof value === "object" && !Array.isArray(value)) defineProp(value, host[name] = {}, path + "." + key);
			else Object.defineProperty(host, name, { // Otherwise define the getter
				configurable: true,
				get: function() {
					// Split the path up by dot
					var tree = path.split(".").slice(1),
						// Get the state we need to apply the tree path to
						master = ndo.parseState(elem);

					// Push in the final property to access
					tree.push(path === "" ? name.substr(1) : name);

					// Recursively iterate down through the path on the master object
					// if we reach the end, return that value.
					return (function recur(obj, path) {
						if(path.length) return recur(obj[path[0]], path.slice(1))
						else return obj;
					})(master, tree);
				}
			});
		});
	})(state, elem, "");
};

/*
 * ndo animation functions. 
 */

/**
 * Hold execution for a specified time.
 * @param  {number} timeout Timeout length in milliseconds.
 * @return {Promise}         
 */
ndo.wait = function(timeout) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve.bind(this), timeout);
	});
};

/**
 * Transform an element.
 * @param  {HTMLElement} elem          
 * @param  {string} tranformation Scale, translate, translateX, translateY, shear, rotate
 * @param  {string} value         Value of transformation function.
 * @param  {number|string} duration      TransitionDuration property.
 * @param  {string} easing        Easing function for transitionTimingFunction.
 * @return {Promise}              
 */
ndo.transform = function(elem, transformation, value, duration, easing) {
	duration = ndo.duration(duration);

	return ndo(function*() {
		elem.style.transitionProperty = "-webkit-transform";
		elem.style.transitionDuration = duration.text;
		if(easing) elem.style.transitionTimingFunction = easing;

		var prefix = "webkit", //TODO: moz.
			transform = elem.style[prefix + "Transform"], // Get the current transform
			newValue = transformation + "(" + value + ")"; // Create the new transform

		// Dynamic regex for each transformation
		var transformRegex = new RegExp(transformation + "\\(([^\\)]+)\\)");

		// Add transform to current transformation
		if(transformRegex.exec(transform)) {
			elem.style[prefix + "Transform"] = transform.replace(transformRegex, newValue)
		} else elem.style[prefix + "Transform"] = transform + " " + newValue;

		// And wait until transform is finished
		yield ndo.wait(duration.length);
	});
};

/**
 * Rotate an element.
 * @param  {HTMLElement} elem     
 * @param  {number} degrees  
 * @param  {number} duration 
 * @param  {string} easing   See .transform (optional)
 * @return {Promise}          
 */
ndo.rotate = function(elem, degrees, duration, easing) {
	return ndo.transform(elem, "rotate", degrees + "deg", duration, easing);
};

/**
 * Scale an element in two dimensions.
 * @param  {HTMLElement} elem     
 * @param  {number} x
 * @param  {number} y
 * @param  {number} duration 
 * @param  {string} easing   See .transform (optional)
 * @return {Promise}          
 */
ndo.scale = function(elem, x, y, duration, easing) {
	return ndo.transform(elem, "scale", x + ", " + y, duration, easing);
};

/**
 * Translate an element.
 * @param  {HTMLElement} elem     
 * @param  {number} x  
 * @param  {number} y  
 * @param  {number} duration 
 * @param  {string} easing   See .transform (optional)
 * @return {Promise}          
 */
ndo.translate = function(elem, x, y, duration, easing) {
	return ndo.transform(elem, "translate", x + "px, " + y + "px", duration, easing);
};

/**
 * Skew an element.
 * @param  {HTMLElement} elem     
 * @param  {number} x
 * @param  {number} y
 * @param  {number} duration 
 * @param  {string} easing   See .transform (optional)
 * @return {Promise}          
 */
ndo.skew = function(elem, x, y, duration, easing) {
	return ndo.transform(elem, "skew", x + "deg, " + y + "deg", duration, easing);
};

/**
 * Transition the opacity of an element.
 * @param  {HTMLElement} elem     
 * @param  {number} opacity  Value for css property opacity
 * @param  {number} duration 
 * @param  {string} easing   See .transform.
 * @return {Promise}         
 */
ndo.fade = function(elem, opacity, duration, easing) {
	duration = ndo.duration(duration);

	return ndo(function*() {
		elem.style.transitionProperty = "opacity";
		elem.style.transitionDuration = duration.text;
		elem.style.transitionTimingFunction = easing;
		elem.style.opacity = opacity;
		yield ndo.wait(duration.length);
	});
};

/**
 * Fade in an element.
 * @param  {HTMLElement} elem     
 * @param  {number} duration 
 * @param  {string} easing   See .transform
 * @return {Promise}          
 */
ndo.fadeIn = function(elem, duration, easing) {
	return ndo.fade(elem, 1, duration, easing);
};

/**
 * Fade out an element.
 * @param  {HTMLElement} elem     
 * @param  {number} duration 
 * @param  {string} easing   See .transform
 * @return {Promise}          
 */
ndo.fadeOut = function(elem, duration, easing) {
	return ndo.fade(elem, 0, duration, easing);
};

/**
 * Set a css property on a value.
 * @param  {HTMLElement} elem  
 * @param  {string|object} prop  String or object of prop:value
 * @param  {string} value Property value
 */
ndo.css = function(elem, prop, value) {
	if(typeof prop === "object") {
		for(var key in prop) 
			ndo.css(elem, key, prop[key])
	} else elem.style.setProperty(prop, value);
};

/**
 * Get and return a HTMLElement with ndo state with selector.
 * @param {string} selector What you would supply to querySelector.	 
 * @return {HTMLElement}
 */
ndo["get"] = function() {
	var elem = document.querySelector.apply(document, arguments);

	if(elem) ndo.addProperties(elem);

	return elem;
};

/*
 * Syntax sugar for the API.
 */
ndo.move = ndo.translate;
ndo.delay = ndo.wait;

/*
 * All the expose n<fn> API globally.
 */
ndo.api = ["wait", "delay", "run", "procedure",
	"rotate", "translate", "scale", "skew", "move", "fade", "fadeIn", "fadeOut",
	"get", "css"]
	.forEach(function(v) { window["n" + v] = ndo[v]; });