export default {
	/* ==========================
	        MODULE META
	========================== */
	name: "offense-whitelist-highlighter module",
	// module-id: b2ZmZW5zZS13aGl0ZWxpc3QtaGlnaGxpZ2h0ZXIgbW9kdWxl

	enabled: true,

	match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],

	exclude: [],

	runAt: "document-end",

	iframe: true,

	once: true,

	priority: 10,

	selector: {
		frameName: "PAGE_SEM",
		table: "#tableSection table#defaultTable",
		thead: "#tableSection table#defaultTable thead",
		tbody: "#tableSection table#defaultTable tbody",
		rows: "#tableSection table#defaultTable tbody tr",
	},
	mss: {
		whitelist: [
			"REC: Alert from IDPS of BO_KHCN containing",
			"Cang_HPG"
		],
	},
	siem: {
		whitelist: [
			"EXE: Detect wscript or cscript execute vbs file",
			"REC: Web suspicious user agent containing HTTP 200 - OK",
			"REC:CVE-2019-10068 Kentico RCE",
			"REC: CVE-2023-22518 Exploitation Attempt - Vulnerable Endpoint Connection",
			"REC-Detect log4j payload",
			"REC: Exploit payload detection",
			"REC: No way PHP Strikes again CVE-2024-4577",
			"INT: Detect Account Administrator Login Success to the System containing POST",
			"INT: Web Exploit Detection",
			"INT: Detect Foreign IP Login Success to the system containing POST",
			"COL: Detection File Exchange Dropped containing Success Audit: A handle to an object was requested",
			"DEV: Common Webshell's name detected containing POST",
			"Detect ddos event",
			"Potential HTTP DoS Flooding containing HTTP 200 - Ok",
			"Suspicious Network Denial of Service dichvucong.gov.vn in Waf",
			"Supicious CVE-2021-44515 exploit",
			"High Number of Emails From Unauthorized Users",
			"Local UDP Scanner Detected containing Deny protocol src",
			"HTTP 200 - OK",
			"HTTP 403 - Forbidden",
			"HTTP 404 - Not Found",
			"HTTP 302 - Object Moved",
			"HTTP 304 - Not Modified",
			"POST",
			"GET",
			"HEAD",
		],
	},
};
