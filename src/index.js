import registry from "./registry.js";
import { isMatch } from "./helper/match.js";

function bootstrap() {
	const url = location.href;
	const isIframe = window.self !== window.top;

	registry
		.filter(({ config }) => config.enabled)
		.sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0))
		.forEach(({ run, config }) => {
			if (config.iframe === false && isIframe) return;

			if (config.match && !isMatch(url, config.match)) return;
			if (config.exclude && isMatch(url, config.exclude)) return;

			try {
				run({
					url,
					isIframe,
					env: "tampermonkey",
				});
			} catch (e) {
				console.error(`❌ Module ${config.name} error`, e);
			}
		});
}

bootstrap();
