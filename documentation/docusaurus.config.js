module.exports = {
	title: "React List Utilities",
	tagline: "Utilities for doing lists properly",
	url: "https://rlu.aht.cx",
	baseUrl: "/",
	favicon: "img/favicon.ico",
	organizationName: "ahtcx", // Usually your GitHub org/user name.
	projectName: "react-list-utilities", // Usually your repo name.
	themes: ["@docusaurus/theme-live-codeblock"],
	themeConfig: {
		navbar: {
			title: "React List Utilities",
			logo: {
				alt: "My Site Logo",
				src: "img/logo.svg",
			},
			items: [
				{
					to: "documentation/introduction",
					activeBasePath: "docs",
					label: "Documentation",
					position: "left",
				},
				// { to: "blog", label: "Blog", position: "left" },
				{
					href: "https://github.com/facebook/docusaurus",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {},
		// footer: {
		// 	style: "dark",
		// 	// links: [
		// 	// 	{
		// 	// 		title: "Docs",
		// 	// 		items: [
		// 	// 			{
		// 	// 				label: "Style Guide",
		// 	// 				to: "docs/doc1",
		// 	// 			},
		// 	// 			{
		// 	// 				label: "Second Doc",
		// 	// 				to: "docs/doc2",
		// 	// 			},
		// 	// 		],
		// 	// 	},
		// 	// 	{
		// 	// 		title: "Community",
		// 	// 		items: [
		// 	// 			{
		// 	// 				label: "Stack Overflow",
		// 	// 				href: "https://stackoverflow.com/questions/tagged/docusaurus",
		// 	// 			},
		// 	// 			{
		// 	// 				label: "Discord",
		// 	// 				href: "https://discordapp.com/invite/docusaurus",
		// 	// 			},
		// 	// 			{
		// 	// 				label: "Twitter",
		// 	// 				href: "https://twitter.com/docusaurus",
		// 	// 			},
		// 	// 		],
		// 	// 	},
		// 	// 	{
		// 	// 		title: "More",
		// 	// 		items: [
		// 	// 			{
		// 	// 				label: "Blog",
		// 	// 				to: "blog",
		// 	// 			},
		// 	// 			{
		// 	// 				label: "GitHub",
		// 	// 				href: "https://github.com/facebook/docusaurus",
		// 	// 			},
		// 	// 		],
		// 	// 	},
		// 	// ],
		// 	// copyright: ``,
		// },
	},
	presets: [
		[
			"@docusaurus/preset-classic",
			{
				docs: {
					path: "documentation",
					routeBasePath: "documentation",
					sidebarPath: require.resolve("./sidebars.js"),
					// Please change this to your repo.
					// editUrl: "https://github.com/facebook/docusaurus/edit/master/website/",
				},
				blog: {
					showReadingTime: true,
					// Please change this to your repo.
					// editUrl: "https://github.com/facebook/docusaurus/edit/master/website/blog/",
				},
				theme: {
					customCss: require.resolve("./src/css/custom.css"),
				},
			},
		],
	],
};
