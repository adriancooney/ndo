# ndo
### Generator based CSS animation library
ndo is a CSS animation library that uses the latest ES6 features such as Promises and Generators for quickly prototyping animations. This unforuntately comes at a cost, it currently only works in the latest stable version of Chrome. ndo is a more of an experiment and shouldn't be used in production if your target market is anything besides Chrome. See `examples/` for some example demos.

### Design choices
* Exposes 17 globals, all prefixed with "n", each of which can be accessed on the `ndo` object.
* Defines 4 properties on a `HTMLElement` that's gotten via `nget`, each prefixed with "n";

### Caveats
* Only works in Chrome (for now, waiting for other browsers to catch up).

## API
ndo strives for a simple API to make creating awesome animations as simple, fun and time efficient as possible.

#### `ndo( <generator>, <...*> )`
Execute a generator yielding promises or arrays of promises. First argument will always be a generator, any argument thereafter will be applied to the generator.

```js
ndo(function*(sentence) {
	yield nwait(1000); // Hold for 1000ms
	console.log(sentence);
}, "Hello world!");
```

### Animation
ndo has a whole host of animation function to make creating animations easy and expressive.

#### `ntranslate( <element>, <x>, <y>, <duration> [, <easing>] )`
Translate an element to a position using css `translate` transform. Also named `nmove`.

```js
ndo(function*() {
	var box = nget("#box");

	yield ntranslate(box, 50, 50, 1000); // Translate the box to 50px, 50px in 1000ms (1 second)
	yield ntranslate(box, 100, 100, 2000, "ease-in-out"); // Translate the box to 100px, 100px in 2000ms (2 seconds) with easing "ease-in-out"
});
```

#### `nrotate( <element>, <angle (degrees)>, <duration> [, <easing>] )`
Rotate an element using CSS transform `rotate`.

```js
ndo(function*() {
	var box = nget("#box");

	yield nrotate(box, 60, 1000); // Rotate the box 60 degrees
});
```

#### `nscale( <element>, <x scale>, <y scale>, <duration> [, <easing>] )`
Scale an element using the CSS transform `scale`.

```js
ndo(function*() {
	var box = nget("#box");

	yield nscale(box, 2, 2, 1000); // Scale the box to twice it's size
});
```

#### `nskew( <element>, <x skew angle (degrees)>, <y skew angle (degrees)>, <duration> [, <easing>] )`
Skew an element using the CSS transform `skew`.

```js
ndo(function*() {
	var box = nget("#box");

	yield nskew(box, 30, 60, 1000); // Skew the box at angles 30 and 60 degrees
});
```

#### `nfade( <element>, <opacity (0-1)>, <duration> [, <easing>] )`
Skew an element using the CSS property `opacity`.

```js
ndo(function*() {
	var box = nget("#box");

	yield nfade(box, 0, 1000); // Fade out the box
});
```

#### `nfade[In|Out]( <element>, <duration> [, <easing>] )`
Fade in or out an element. Simply an alias for `nfade( <element>, [0|1], <duration>, <easing> )`.

```js
ndo(function*() {
	var box = nget("#box");

	yield nfadeOut(box, 1000); // Fade out the box
});
```

#### `nwait( <duration> )`
Delay the program for a specified duration.

```js
ndo(function*() {
	var box = nget("#box");

	console.log("Hello");
	yield nwait(1000); // Wait for 1000ms
	console.log("World.")
});
```

#### `ncss( <element>, <prop>|<object> [, <value>] )`
Apply a css value to an element. **This is not animated**.

```js
ndo(function*() {
	var box = nget("#box");

	ncss(box, "border", "1px solid #fff");
	ncss(box, {
		height: "30px",
		width: "30px"
	});
});
```

### Concurrent animations
ndo is capable of running animations concurrently by simple `yield`ing them within an array. The program will not resume execution until all animations or delays are completed. For example:

```js
ndo(function*() {
	var box = nget("#box");

	yield [ nrotate(box, 30, 1000), nscale(box, 2, 2000) ]; // Rotate and scale the box at the same time
});
```

### Procedures
Sometimes we want to have reusable animations, for this ndo has procedures. Procedures can be defined at runtime and can be called anywhere using `n<name>` or `nrun(name)`. It's basically syntaxtic sugar around functions. For example:

```js
// Define the procedure
nprocedure("wiggle", function*(box) {
	for(var i = 0; i < 3; i++) {
		yield ntranslate(box, 5, 0, 50);
		yield ntranslate(box, -5, 0, 50);
	}
});

ndo(function*() {
	var box = nget("#box");
	yield nwiggle(box); // Directly call it
	yield nrun("wiggle", box); // Or explicitly
});
```

#### `nprocedure( <name>, <generator> )`
Create a new procedure with a generator. Each procedure is automatically exposed on the window with the prefix "n".

```js
nprocedure("wiggle", function*(box) {
	for(var i = 0; i < 3; i++) {
		yield ntranslate(box, 5, 0, 50);
		yield ntranslate(box, -5, 0, 50);
	}
});
```

#### `nrun( <name>, <...*> )`
Run a procedure by name with arguments. Returns a promise.

```js
ndo(function*() {
	var box = nget("#box");
	yield nwiggle(box); // Directly call it
	yield nrun("wiggle", box); // Or explicitly
});
```

Alternatively, each procedure can be called by name with the prefix "n" so `nwiggle( <...*> )` is the same as `nrun("wiggle", <...*> )`

### Properties
To help with some transforming, ndo adds some properties to an object which is retieved by `nget`. Each property access is dynamic so every time you access the property, the current value will be returned.

#### `nget( <selector> )`
Get and return a DOM element (not nodeList!) with added properties.

```js
ndo(function*() {
	var box = nget("#box") //-> <div id="box"></div>

	//box.ntranslate.x, box.ntranslate.y -> 0, 0
	yield ntranslate(box, 50, 0, 1000);
	//box.ntranslate.x, box.ntranslate.y -> 50, 0
});
```

#### `<element>.ntranslate.[x|y]`
Get the current translation position of the element. (Number)

#### `<element>.nskew.[x|y]`
Get the current skew of the element. (Number)

#### `<element>.nrotate`
Get the current rotation of the element in degrees. (Number)

#### `<element>.scale.[x|y]`
Get the current scale factors in the x and y of the element. (Number)

## Credits and license
Created by [Adrian Cooney](http://twitter.com/adrian_cooney). License MIT.