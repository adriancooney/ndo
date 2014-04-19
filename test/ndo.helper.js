test("ndo.parseState", function() {
	var box = document.getElementById("n-box");

	box.style.webkitTransform = "rotate(30deg)";
	box.style.webkitTransform += "scale(4, 4)";
	box.style.webkitTransform += "translate(40px, 40px)";
	box.style.webkitTransform += "skew(30deg, 40deg)";

	var state = ndo.parseState(box);
	equal(state.rotate, 30);
	equal(state.translate.x, 40);
	equal(state.translate.y, 40);
	equal(state.scale.x, 4);
	equal(state.scale.y, 4);
	equal(state.skew.x, 30);
	equal(state.skew.y, 40);
});

test("ndo.parseState: scale(N)", function() {
	var box = document.getElementById("n-box");

	box.style.webkitTransform += "scale(4)";

	var state = ndo.parseState(box);

	equal(state.scale.x, 4);
	equal(state.scale.y, 4);
});

test("ndo.addProperties", function() {
	var box = document.getElementById("n-box1");

	var state = ndo.addProperties(box);

	box.style.webkitTransform = "translate(40px, 40px)";
	box.style.webkitTransform += " rotate(30deg)";

	equal(box.ntranslate.x, 40);
	equal(box.nrotate, 30);

	box.style.webkitTransform = "rotate(40deg)";
	equal(box.nrotate, 40);
});

test("ndo.duration", function() {
	var d1 = ndo.duration("300ms"),
		d2 = ndo.duration("300s"),
		d3 = ndo.duration(300),
		d4 = ndo.duration("foobar");

	ok(d1.length && d1.text);
	equal(d1.length, 300);
	equal(d1.text, "300ms");

	equal(d2.length, 300 * 1000);
	equal(d2.text, "300s");

	equal(d3.length, 300);
	equal(d3.text, "300ms");

	equal(d4.length, 300);
	equal(d4.text, "300ms");
});