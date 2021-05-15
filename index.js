const fs = require('fs').promises;
const path = require('path');

const dateFormat = require("dateformat");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const sass = require('node-sass');
const pug = require('pug');
const YAML = require('yaml');
const sharp = require('sharp');
const md = require('markdown-it')({
	html: true,
	breaks: true,
})
	.use(require("markdown-it-collapsible"))
	.use(require("markdown-it-anchor"))
	.use(require("markdown-it-external-links"),{
		externalClassName: null,
		internalClassName: null,
		externalTarget: "_blank",
	})

const cwd =  process.cwd();

const defaultConfig = {
	// Name of your website
	name: 'My Website',
	// What your website is about
	description: "A website about things I like",
	// Canonical URL for your website
	siteUrl: '',
	// Where to put the generated website
	dest: './build',
	// Where all your content is
	root: './sources',
	// Files to copy verbatim
	public: 'public',
	// Page markdown (must include a layout.pug template at least)
	templates: 'templates',
	// Stylesheets (written in sass)
	css: 'css',
	// Your articles (written in Markdown)
	articles: 'articles',
	// Images types to make compressed versions of 
	crunch: [".jpg",".png"],
}

async function walk(dir){
	let files = [];
	const elems = await fs.readdir(dir);
	for (const elem of elems) {
		const stat = await fs.stat(path.join(dir,  elem));
		if (stat.isDirectory()) {
			files = files.concat(await walk(path.join(dir,  elem)));
		} else {
			files.push(path.join(dir,  elem));
		}
	}
	return files;
}

async function copyPublic(config){
	const publicPath = path.join(config.root, config.public);
	const files = await walk(publicPath);
	let promises = [];
	for (const file of files){
		const target = path.join(config.dest, file.replace(publicPath, ""));
		const targetdir = path.parse(target).dir;
		promises.push(fs.mkdir(targetdir, { recursive: true })
			.then(()=>{
				fs.copyFile(file, target)
			}));
	}
	return promises;
}

async function crunchImages(config){
	const publicPath = path.join(config.root, config.public);
	const files = await walk(publicPath);
	let promises = [];
	for (const file of files){
		const ext = path.extname(file);
		if (config.crunch.includes(ext)){
			const target = path.join(config.dest, file.replace(publicPath, "").replace(ext,".700w.jpg"));
			const targetdir = path.parse(target).dir;
			let promise = sharp(file)
				.resize(700)
				.jpeg()
				.toBuffer();
			promises.push(fs.mkdir(targetdir, { recursive: true })
				.then(()=>{
					promise.then((crunched)=>{
						fs.writeFile(target,  crunched);
					});
				}))
			promises.push(promise);
		}
	}
	return promises;
}

async function compileCss(config){
	const cssPath = path.join(config.root, config.css);
	const files = await walk(cssPath);
	let promises = [];
	for (const file of files){
		const parsed = path.parse(file);
		const target = path.join(config.dest, file.replace(cssPath, "").replace(parsed.ext, '.css'));
		const targetdir = path.parse(target).dir;
		promises.push(fs.mkdir(targetdir, { recursive: true })
			.then(()=>{
				sass.render({
					file: file,
					options: {
						indentedSyntax: true
					}
				}, function(err, result) {
					if (err) return console.error(err);
					promises.push(fs.writeFile(target,  result.css));
				});
			}));
		
	}
	return Promise.all(promises);
}

function extractMetadataFromArticle(article){
	const dom = new JSDOM(article);
	const paragraphs = dom.window.document.getElementsByTagName("p")
	let i = 0;
	while (i<paragraphs.length && paragraphs[i].contains(dom.window.document.querySelector("img"))){
		i++;
	}
	const preview = i<paragraphs.length ? paragraphs[i].textContent : "No preview";
	const firstParagraph = dom.window.document.querySelector("p")
	const image = dom.window.document.querySelector("img")
	const firstImage = (image && firstParagraph.contains(image)) ? image.src : "/favicon.png";
	return {
		imageURL: firstImage,
		preview: preview
	}
}

async function compileHtml(config, templates, articles){
	const htmlPath = path.join(config.root, config.articles);
	const files = await walk(htmlPath);
	let promises = [];
	for (const file of files){
		const parsed = path.parse(file);
		const target = path.join(config.dest, file.replace(htmlPath, "").replace(parsed.ext, '.html'));
		const targetdir = path.parse(target).dir;
		const [markdown, yaml] = (await fs.readFile(file, {encoding: "utf-8"})).split(/(?=%YAML)/);
		const article = md.render(markdown);
		
		
		let metadata = {}
		
		// Load config into metadata
		metadata = Object.assign(metadata, config);
		// Load extracted article data into metadata
		metadata = Object.assign(metadata, extractMetadataFromArticle(article));
		// Load defaults into metadata
		metadata.status = "published";
		metadata.title = parsed.name
			.split(/[ -]/)
			.map(s=>s.charAt(0).toUpperCase() + s.slice(1))
			.join(" ");
		metadata.url = file.replace(htmlPath, '').replace(parsed.ext, '');
		// Load parsed yaml into metadata
		if (yaml){
			metadata = Object.assign(metadata, YAML.parse(yaml));
		}
		
		if (metadata.hasOwnProperty("created") && !metadata.hasOwnProperty("updated")){
			metadata.updated = metadata.created;
		}
		
		metadata.content = article;
		articles.push(metadata);
		const html = templates[metadata.layout ? metadata.layout : "layout"](metadata)
		let promise = fs.mkdir(targetdir, { recursive: true });
		promises.push(promise);
		promise
			.then(()=>{
				promises.push(fs.writeFile(target, html))
			});
	}
	return Promise.all(promises);
}

async function generateTagsPage(config, templates, tags){
	const target = path.join(config.dest, "tags.html");
	let markdown = "# All tags"
	const tagnames = Object.keys(tags)
		.sort((a,b)=> tags[b].length - tags[a].length);
	for (const tag of tagnames){
		const count = tags[tag].length;
		markdown += `\n- [**${tag}** (${count} ${count!=1 ? "posts" : "post"})](/posts/${tag})`
	}
	let metadata = Object.assign({}, config);
	metadata.title = "Tags";
	metadata.content = md.render(markdown);
	const html = templates.layout(metadata)
	return fs.writeFile(target, html)
}

async function generateTaggedPostsPage(config, templates, articles, tag){
	const target = path.join(config.dest, `posts/${tag}.html`);
	let markdown = `# Posts tagged with ${tag}`;
	markdown += "\n[View all available tags](/tags)";
	const datedArticles = articles
		.filter(a => a.hasOwnProperty('tags') && a.tags.includes(tag))
		.filter(a => a.hasOwnProperty("created"))
		.sort((a,b)=> new Date(b.created) - new Date(a.created) );
	for (const article of datedArticles){
		if (article.status == "unpublished") continue;
		markdown += `\n# [${article.title}](${article.url})`;
		markdown += `\n${article.preview}`;
		markdown += `<br /><span class="date">${dateFormat(new Date(article.created), "mmmm dS, yyyy")}</span>`;
	}
	let metadata = Object.assign({}, config);
	metadata.title = `Articles tagged with ${tag}`;
	metadata.content = md.render(markdown);
	const html = templates.layout(metadata)
	return fs.writeFile(target, html);
}

async function generatePostsPage(config, templates, articles){
	const target = path.join(config.dest, "posts.html");
	let markdown = "[Filter by tag](/tags)";
	const datedArticles = articles
		.filter(a => a.hasOwnProperty("created"))
		.sort((a,b)=> new Date(b.created) - new Date(a.created) );
	for (const article of datedArticles){
		if (article.status == "unpublished") continue;
		markdown += `\n# [${article.title}](${article.url})`;
		markdown += `\n${article.preview}`;
		markdown += `<br /><span class="date">${dateFormat(new Date(article.created), "mmmm dS, yyyy")}</span>`;
	}
	let metadata = Object.assign({}, config);
	metadata.title = "Posts";
	metadata.content = md.render(markdown);
	const html = templates.layout(metadata)
	return fs.writeFile(target, html);
}

async function generatePostsAndTags(config, templates, articles){
	let tags = {};
	let promises = [];
	for (const article of articles){
		if (!article.tags) continue;
		if (article.status == "unpublished") continue; 
		for (const tag of article.tags){
			if (!tags.hasOwnProperty(tag)){
				tags[tag]=[];
			} 
			tags[tag].push(article);
		} 
	}
	await fs.mkdir(path.join(config.dest, "posts"), { recursive: true })
	for (const tag of Object.keys(tags)){
		promises.push(generateTaggedPostsPage(config, templates, articles, tag));
	} 
	promises.push(generatePostsPage(config, templates, articles));
	promises.push(generateTagsPage(config, templates, tags));
	return Promise.all(promises);
}

function renderPugError(error, filename){
	let out = `Error on line ${error.line}, column ${error.column} in ${filename || error.filename}`;
	const src = error.src.split('\n');
	for (let line = Math.max(0,error.line-3); line<Math.min(src.length, error.line+3); line++){
		if (line<error.line-1 || line>error.line-1) out += `\n${(""+line).padStart(5," ")}|${src[line].replace(/\t/g, "    ")}`;
		else if (line===error.line-1) {
			out += `\n${("> " + line + "").padStart(5, " ")}|${src[line].replace(/\t/g, "    ")}`;
			let dashes = "-".repeat(src[line].substr(0,error.column-1).replace(/\t/g, "    ").length);
			out += `\n${"-".repeat(6)}${dashes}^`;
		}
	}
	out += `\nError: ${error.msg}`;
	return out;
}

async function getTemplates(config){
	const templatePath = path.join(config.root, config.templates);
	const files = await walk(templatePath);
	let templates = {};
	let templateData
	for (const file of files){
		const templateFilename = path.parse(file).name
		try {
			templateData = await fs.readFile(file);
		} catch (err) {
			throw (`Could not read ${file}\n${err}`);
		} finally {
			try {
				templates[templateFilename] = pug.compile(templateData, {
					basedir: templatePath,
					filename: templateFilename
				});
			} catch (err) {
				throw renderPugError(err, file);
			}
		}
		
	}
	return templates;
}


async function verifyAndPrepare(config){
	// Try to create destination directory
	try {
		await fs.mkdir(config.dest, { recursive: true });
	} catch (err) {
		throw (`Could not create destination directory: ${config.dest}\n${err}`);
	}
	// Source directories exist and can be read from
	const sources = [
		config.root,
		path.join(config.root, config.public),
		path.join(config.root, config.templates),
		path.join(config.root, config.css),
		path.join(config.root, config.articles),
	]
	for (const source of sources){
		try {
			await walk(source);
		} catch (err) {
			throw (`Could not read from source directory: ${source}\n${err}`);
		}
	} 
}

let superstructure = {
	build: async (config)=>{
		let promises = [];
		config = Object.assign(defaultConfig, config || {});
		await verifyAndPrepare(config);
		const templates = (await getTemplates(config));
		let articles = [];
		promises.push(compileHtml(config, templates, articles)
			.then(()=>{
				generatePostsAndTags(config, templates, articles);
			}));
		promises.push(copyPublic(config));
		promises.push(crunchImages(config));
		promises.push(compileCss(config));
		return Promise.all(promises);
	}
}

module.exports = superstructure;