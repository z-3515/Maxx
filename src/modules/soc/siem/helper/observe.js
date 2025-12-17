export function observeElement(target, callback, options = {}) {
	if (!target) return null;

	const observer = new MutationObserver((mutations) => {
		callback(mutations);
	});

	observer.observe(target, {
		childList: true,
		subtree: true,
		...options,
	});

	return observer;
}
