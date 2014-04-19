asyncTest("nwait", function() {
	var now = new Date();

	ndo(function*() {
		yield nwait(300);
		ok(((new Date) - now) >= 300);
		start();
	});
});

test("nrotate", function() {
	var box = nget("#n-box");

	box.style.webkitTransform = "";
	nrotate(box, 30, 1000, "ease-in-out");

	equal(box.style.transitionDuration, "1000ms");
	equal(box.style.transitionTimingFunction, "ease-in-out");
	equal(box.style.webkitTransform, "rotate(30deg)");
});

test("ntranslate", function() {
	var box = nget("#n-box");

	box.style.webkitTransform = "";
	ntranslate(box, 30, 30, 1000);

	equal(box.style.transitionDuration, "1000ms");
	equal(box.style.webkitTransform, "translate(30px, 30px)");
});

test("nskew", function() {
	var box = nget("#n-box");

	box.style.webkitTransform = "";
	nskew(box, 30, 30, 1000);

	equal(box.style.transitionDuration, "1000ms");
	equal(box.style.webkitTransform, "skew(30deg, 30deg)");
});

test("nscale", function() {
	var box = nget("#n-box");

	box.style.webkitTransform = "";
	nscale(box, 30, 30, 1000);

	equal(box.style.transitionDuration, "1000ms");
	equal(box.style.webkitTransform, "scale(30, 30)");
});

test("nfade", function() {
	var box = nget("#n-box");

	nfade(box, 0, 1000);

	equal(box.style.transitionDuration, "1000ms");
	equal(box.style.opacity, "0");
});

test("ncss", function() {
	var box = nget("#n-box");
	ncss(box, "border-width", "1px");
	ncss(box, { height: "40px" });

	equal(box.style.borderWidth, "1px");
	equal(box.style.height, "40px");
});