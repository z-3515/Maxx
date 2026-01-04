import test from "./modules/test/index.js";
import testConfig from "./modules/test/config.js";

import selectedSearch from "./modules/selected_search/index.js";
import selectedSearchConfig from "./modules/selected_search/config.js";

import offenseWhitelistHighlighter from "./modules/soc/siem/offense_whitelist_highlighter/index.js";
import offenseWhitelistHighlighterConfig from "./modules/soc/siem/offense_whitelist_highlighter/config.js";

import logPrettier from "./modules/soc/siem/log_prettier/index.js";
import logPrettierConfig from "./modules/soc/siem/log_prettier/config.js";

import runHexDecoderModule from "./modules/soc/siem/hex_decoder/index.js";
import hexDecoderConfig from "./modules/soc/siem/hex_decoder/config.js";

import noteShift from "./modules/soc/ticket/note_shift/index.js";
import noteShiftConfig from "./modules/soc/ticket/note_shift/config.js";

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
    {
        run: logPrettier,
        config: logPrettierConfig,
    },
    {
        run: runHexDecoderModule,
        config: hexDecoderConfig,
    },
    {
        run: noteShift,
        config: noteShiftConfig,
    },
];
