test("ndo.parseState: basic case", function() {
	var box = document.getElementById("box");

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
	var box = document.getElementById("box");

	box.style.webkitTransform += "scale(4)";

	var state = ndo.parseState(box);

	equal(state.scale.x, 4);
	equal(state.scale.y, 4);
});