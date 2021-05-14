# Build a Website with Superstructure

Building a website with Superstructure is (mostly) easy! Here's a little explanation to get you going!

## Install Superstructure

- Have [node.js](https://nodejs.org/en/) installed
- Run `npm install superstructure`
- Copy the [example project](https://github.com/Bradshaw/superstructure/tree/main/example)
- Build by running `node index.js`

### Usage

To configure your website, you can do something like this in your `index.js` file:

```js
// Require superstructure
const superstructure = require("superstructure");

// Set your configuration
const config = {
	// Name of your website
	name: 'Example Website',
	// What your website is about
	description: "A website that demonstrates Superstructure",
	// Canonical URL for your website
	siteUrl: 'https://github.com/Bradshaw/superstructure/example',
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
};


superstructure.build(config)
	.then(()=>{
		// Code you want to run when the build is done
		console.log("After build");
	});
```


%YAML 1.2
---
title: Build a website
tags:
  - superstructure
created: 2021-05-14T18:18:24.853Z
