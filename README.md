# Superstructure

An opinionated website builder for blog-ish websites.

## Opinions

- Superstructure builds static websites
- Superstructure doesn't add anything you don't need
- Superstructure doesn't care how or where you host your website
- Superstructure lets you design your website how you like
- Superstructure just builds, and does some housekeeping

## Blog-ish

Superstructure builds websites that have articles.  
The articles can be tagged.  
The articles are all listed together on a `/posts` page.  
The tags are browsable on a `/tags` page.
Each tag has it's own `/posts/<tag>` page.

## Using Superstructure

Articles are written in [Markdown](https://www.markdownguide.org/), and inserted into a layout written in [Pug](https://pugjs.org/api/getting-started.html) and styled with [Sass](https://sass-lang.com/).  
Metadata about the article can be defined in little [YAML](https://yaml.org/) chunk at the end.

### Installing

- Have [node.js](https://nodejs.org/en/) installed
- Run `npm install superstructure`
- Create an `index.js` file and some Markdown files like below
- Also have layouts and sass files, documentation and examples coming soon 🤷
- Maybe look at how it works in [my website](https://github.com/Bradshaw/spaceshipsin.space)
- Build by running `node index.js`

### Usage
`index.js`
```js
// Require superstructure
const superstructure = require("superstructure");

// Set your configuration
const config = {
    // Name of your website
    title: 'Spaceships in Space',
    // Where to put the generated website
    dest: './build',
    // Where all your content is
    root: './sources',
    // Files to copy verbatim
    public: 'public/',
    // Page templates (must include a layout.pug template at least)
    templates: 'pug/',
    // Stylesheets (written in sass)
    css: 'sass/out/',
    // Your articles (written in Markdown)
    markdown: 'markdown/out',
    // Images types to make compressed versions of 
    crunch: [".jpg",".png"],
};


superstructure.build(config)
    .then(()=>{
        // Code you want to run when the build is done
        console.log("After build");
    });
```

### Example article
`sources/markdown/out/demo.md`
```markddown

# Superstructure Demo

This is just a demo to show how things work

## Another 

With some more stuff


%YAML 1.2
---
title: Superstructure Demo
tags:
  - random
  - blog
created: 2021-05-01T08:55:24.853Z
```
