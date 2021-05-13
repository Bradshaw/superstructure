const fs = require('fs').promises;
const path = require('path');

const sass = require('node-sass');

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
				// console.log(`Copy ${file} to ${target}`);
				fs.copyFile(file, target)
			});
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
				console.log(`Compile ${file} to ${target}`);
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


let superstructure = {
	build: async (config)=>{
		try{
			await copyPublic(config);
			await compileCss(config);
		} catch (err) {
			console.error(err);
		}
	}
}

module.exports = superstructure;