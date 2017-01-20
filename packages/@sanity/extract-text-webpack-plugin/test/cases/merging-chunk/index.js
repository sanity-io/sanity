require("./a.txt");
require.ensure([], function() {
	require("./b.txt");
});
