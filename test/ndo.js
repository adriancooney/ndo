asyncTest("ndo", function() {
	ndo(function*() {
		ok(1);
		start();
	});
});

test("ndo: bad parameters", function() {
	throws(function() {
		ndo({});
	});
});

asyncTest("ndo: arguments", function() {
	ndo(function*(a, b, c) {
		equal(a, 1);
		equal(b, 2);
		equal(c, 3);
		start();
	}, 1, 2, 3);
});

test("API", function() {
	var api = ["wait", "delay", "run", "procedure",
	"rotate", "translate", "scale", "skew", "move", "fade", "fadeIn", "fadeOut",
	"get", "css"];

	for(var i = 0; i < api.length; i++) ok(window["n" + api[i]], api[i] + " present.");
});