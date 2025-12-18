import test from "./modules/test/index.js";
import testConfig from "./modules/test/config.js";

import selectedSearch from "./modules/selected_search/index.js";
import selectedSearchConfig from "./modules/selected_search/config.js";

import offenseWhitelistHighlighter from "./modules/soc/siem/offense_whitelist_highlighter/index.js";
import offenseWhitelistHighlighterConfig from "./modules/soc/siem/offense_whitelist_highlighter/config.js";

export default [
	{
		run: test,
		config: testConfig,
	},
	{
		run: selectedSearch,
		config: selectedSearchConfig,
	},
	{
		run: offenseWhitelistHighlighter,
		config: offenseWhitelistHighlighterConfig,
	},
];
