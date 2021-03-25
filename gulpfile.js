const gulp = require('gulp');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const zip = require('gulp-zip');

const rollup = require('rollup');
const { terser } = require('rollup-plugin-terser');

const fs = require('fs');

const package = require('./package.json');
const moduleName = package.name;

sass.compiler = require('node-sass');

const bundleTask = () => {
	return rollup.rollup({
		input: './src/index.js',
		plugins: [
			terser()
		]
	}).then(bundle => {
		return bundle.write({
			file: `./devbuild/${moduleName}.js`,
			format: 'iife',
			sourcemap: true
		});
	});
};

const moduleTask = (cb) => {
	const module = {
		"name": moduleName,
		"title": package.title,
		"description": package.description,
		"version": package.version,
		"author": package.author,
		"url": package.url,
		"manifest": package.manifest,
		"download": package.download,
		"readme": package.readme,
		"changelog": package.changelog,
		"bugs": package.bugs,
		"minimumCoreVersion": package.minimumCoreVersion,
		"compatibleCoreVersion": package.compatibleCoreVersion,
		"scripts": [
			`${moduleName}.js`
		],
		"styles": [],
		"packs": []
	};

	if ('MANIFEST' in process.env) {
		module.manifest = process.env.MANIFEST;
	}

	if ('DOWNLOAD' in process.env) {
		module.download = process.env.DOWNLOAD;
	}

	const stylePath = `${moduleName}.css`;
	if (fs.existsSync(`devbuild/${stylePath}`)) {
		module.styles.push(stylePath);
	}

	fs.writeFile('devbuild/module.json', JSON.stringify(module, null, '  '), cb);
};

const stylesTask = (cb) => {
	const mainPath = './styles/main.scss';
	if (fs.existsSync(mainPath)) {
		return gulp.src(mainPath)
			.pipe(sass().on('error', sass.logError))
			.pipe(rename(`${moduleName}.css`))
			.pipe(gulp.dest('./devbuild'));
	}
	cb();
};

const templateTask = (cb) => {
	const mainPath = './templates/wrapper-template.html';
	if (fs.existsSync(mainPath)) {
		return gulp.src(mainPath)
			.pipe(gulp.dest('./devbuild/templates'));
	}
	cb();
};

const outputToFoundryTask = (cb) =>{
	const foundryPath = "C:\\FoundryVTT\\Data\\modules\\rolladvantage-token-stamp-2-foundry";
	const mainPath = "./devbuild/**/*";
	return gulp.src(mainPath)
		.pipe(gulp.dest(foundryPath));
};

const devToDist = (cb) =>{
	return gulp.src( "./devbuild/**/*")
		.pipe(gulp.dest("./dist"));
};

const zipBuild = () => {
	return gulp.src('./dist/**')
		.pipe(zip('tokenstamp2-foundry-module-latest.zip'))
		.pipe(gulp.dest('./releases'));
};

gulp.task('bundle', bundleTask);
gulp.task('module', moduleTask);
gulp.task('styles', stylesTask);
gulp.task('templates', templateTask);
gulp.task('toFoundry', outputToFoundryTask);

gulp.task('build', gulp.series(bundleTask, stylesTask, templateTask, moduleTask, outputToFoundryTask));
gulp.task('release', gulp.series(bundleTask, stylesTask, templateTask, moduleTask, devToDist, zipBuild));

gulp.task('watch', () => {
	gulp.watch('src/**/*.js', bundleTask);
	gulp.watch('styles/**/*.scss', stylesTask);
});
