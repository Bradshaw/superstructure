const fs = require('fs').promises;
const path = require('path');


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

	const relative = path.relative(publicPath, cwd);
	
	for (const file of files){
		const target = path.join(config.dest, file.replace(publicPath, ""));
		const targetdir = path.parse(target).dir;
		fs.mkdir(targetdir, { recursive: true })
			.then(()=>{
				console.log(`Copy ${file} to ${target}`);
				fs.copyFile(file, target)
			});
	}
	
}


let superstructure = {
	build: async (config)=>{
		try{
			await copyPublic(config);
		} catch (err) {
			console.error(err);
		}
	}
}

module.exports = superstructure;