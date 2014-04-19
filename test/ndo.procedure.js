asyncTest("ndo.procedure", function() {
	nprocedure("wiggle", function*(arg) {
		ok(arg);
		start();
	});

	ok(ndo.procedures.wiggle);
	nwiggle(true);
});

asyncTest("ndo.procedure: explicit", function() {
	nprocedure("wiggle", function*(arg) {
		ok(arg);
		start();
	});

	nrun("wiggle", true);
});