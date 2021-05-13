const fs = require('fs').promises;
const path = require('path');

const sass = require('node-sass');
const pug = require('pug');
const YAML = require('yaml')
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
				const metadata = yaml ? YAML.parse(yaml) : {};
				const article = md.render(markdown);
				const html = templates[metadata.layout ? metadata.layout : "layout"]({
					title: metadata.title,
					content: article
				})
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


var arraything = [
	{
		name: "thing",
		data: "The data"
	},
	{
		name: "otherthing",
		data: "More data"
	},
]

var things = {
	thing: "The data",
	otherthing: "More data"
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