// Require superstructure
const superstructure = require("superstructure");

// Set your configuration
const config = {
	// Name of your website
	name: 'Example Website',
	// What your website is about
	description: "A website that demonstrates Superstructure",
	// Default author
	author: {
		name: 'Gaeel Bradshaw',
		email: 'gaeel@spaceshipsin.space'
	},
	// Canonical URL for your website
	siteUrl: 'https://superstructure.dev',
	// Where to put the generated website
	dest: './build',
	// Where all your content is
	root: './sources',
	// Files to copy verbatim
	public: 'public',
	// Page templates (must include a layout.pug template at least)
	templates: 'templates',
	// Stylesheets (written in sass)
	css: 'css',
	// Your articles (written in Markdown)
	articles: 'articles',
	// Images types to make compressed versions of 
	crunch: [".jpg",".png"],
	// Feed formats to generate
	feeds: [
		{
			template: "atom",
			target: "atom.xml",
			type: "application:atom+xml"
		},
		{
			template: "rss",
			target: "rss.xml",
			type: "application:rss+xml"
		}
	],
};


superstructure.build(config)
	.then(()=>{
		// Code you want to run when the build is done
		console.log("After build");
	});