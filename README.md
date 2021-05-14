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
- Grab the [example project](example)
- Install Superstructure by running `npm install`
- Build by running `npm start`
