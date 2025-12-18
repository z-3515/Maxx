import test from "./modules/test/index.js";
import testConfig from "./modules/test/config.js";

import selectedSearch from "./modules/soc/siem/selected_search/index.js";
import selectedSearchConfig from "./modules/soc/siem/selected_search/config.js";

export default [
	{
		run: test,
		config: testConfig,
	},
	{
		run: selectedSearch,
		config: selectedSearchConfig,
	},
];
