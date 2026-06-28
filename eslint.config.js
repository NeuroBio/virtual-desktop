const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs", // Electron uses CommonJS (require) by default
			globals: {
				...globals.node,    // Enables Node.js globals like 'process' and 'require'
				...globals.browser, // Enables browser globals for your UI
				...globals.jest,    // Enables Jest globals like 'test' and 'expect'
			},
		},
		rules: {
			"no-unused-vars": "warn", // Warns you about unused variables
			"no-console": "off",      // Allows console.log for debugging
			"semi": ["error", "always"] // Forces semicolons at the end of lines
		},
	},
];