const fs = require('fs').promises;
const path = require('path');


const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const sass = require('node-sass');
const pug = require('pug');
const YAML = require('yaml');
const sharp = require('sharp');
const md = require('markdown-it')({
	html: true,
	breaks: true,
});

const cwd =  process.cwd();



async function walk(dir){
	let files = [];
	try {
		const elems = await fs.readdir(dir);
		for (const elem of elems) {
			const stat = await fs.stat(path.join(dir,  elem));
			if (stat.isDirectory()) {
				files = files.concat(await walk(path.join(dir,  elem)));
			} else {
				files.push(path.join(dir,  elem));
			}
		}
	} catch (err) {
		console.error(err);
	}
	return files;
}

async function copyPublic(config){
	const publicPath = path.join(config.root, config.public);
	const files = await walk(publicPath);
	
	for (const file of files){
		const target = path.join(config.dest, file.replace(publicPath, ""));
		const targetdir = path.parse(target).dir;
		fs.mkdir(targetdir, { recursive: true })
			.then(()=>{
				fs.copyFile(file, target)
			});
	}
}

async function crunchImages(config){
	const publicPath = path.join(config.root, config.public);
	const files = await walk(publicPath);
	for (const file of files){
		const ext = path.extname(file);
		if (config.crunch.includes(ext)){
			const target = path.join(config.dest, file.replace(publicPath, "").replace(ext,".700w.jpg"));
			const targetdir = path.parse(target).dir;
			const crunched = await sharp(file)
				.resize(700)
				.jpeg()
				.toBuffer()
			fs.writeFile(target,  crunched);
		}
	}
}

async function compileCss(config){
	const cssPath = path.join(config.root, config.css);
	const files = await walk(cssPath);

	for (const file of files){
		const parsed = path.parse(file);
		const target = path.join(config.dest, file.replace(cssPath, "").replace(parsed.ext, '.css'));
		const targetdir = path.parse(target).dir;
		fs.mkdir(targetdir, { recursive: true })
			.then(()=>{
				// console.log(`Compile ${file} to ${target}`);
				sass.render({
					file: file,
					options: {
						indentedSyntax: true
					}
			}, function(err, result) {
					if (err) throw(err);
					fs.writeFile(target,  result.css)
				});
			});
	}
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

async function compileHtml(config, templates){
	const htmlPath = path.join(config.root, config.markdown);
	const files = await walk(htmlPath);

	for (const file of files){
		const parsed = path.parse(file);
		const target = path.join(config.dest, file.replace(htmlPath, "").replace(parsed.ext, '.html'));
		const targetdir = path.parse(target).dir;
		fs.mkdir(targetdir, { recursive: true })
			.then(async ()=>{
				const [markdown, yaml] = (await fs.readFile(file, {encoding: "utf-8"})).split(/(?=%YAML)/);
				const article = md.render(markdown);
				
				// Generated metadata
				let metadata = extractMetadataFromArticle(article);
				metadata.title = parsed.name
					.split(/[ -]/)
					.map(s=>s.charAt(0).toUpperCase() + s.slice(1))
					.join(" ");
				metadata.url = file.replace(htmlPath, '').replace(parsed.ext, '');
				
				if (yaml){
					metadata = Object.assign(metadata, YAML.parse(yaml));
				}
				
				metadata.content = article;
				
				const html = templates[metadata.layout ? metadata.layout : "layout"](metadata)
				fs.writeFile(target, html);
			});
	}
}

async function getTemplates(config){
	const templatePath = path.join(config.root, config.templates);
	const files = await walk(templatePath);
	let templates = {};
	for (const file of files){
		const templateFilename = path.parse(file).name
		templates[templateFilename] = pug.compile(await fs.readFile(file), {
			basedir: templatePath,
			filename: templateFilename
		});
	}
	return templates;
}

let superstructure = {
	build: async (config)=>{
		try{
			const templates = (await getTemplates(config));
			copyPublic(config);
			crunchImages(config);
			compileCss(config);
			compileHtml(config, templates);
		} catch (err) {
			console.error(err);
		}
	}
}

module.exports = superstructure;