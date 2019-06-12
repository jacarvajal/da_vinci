'use strict';

/****** DEPENDENCIES ********/

var autoprefixer = require('autoprefixer'),
    browserSync = require('browser-sync').create(),
    changed = require('gulp-changed'),
    color = require('colors'),
    del = require('del'),
    gulp = require('gulp'),
    imagemin = require('gulp-imagemin'),
    jsHint = require('gulp-jshint'),
    jsHintStylish = require('jshint-stylish'),
    postCss = require('gulp-postcss'),
    process = require('yargs').argv,
    sass = require('gulp-sass'),
    sassGlob = require('gulp-sass-glob'),
    sassLint = require('gulp-sass-lint'),
    sourceMaps = require('gulp-sourcemaps');

/********** VARIABLES *************/

// Hosts - change localhost for see it in browsersync
var path = 'localhost';

// Paths

var srcAssets = {
  images: 'src/images/',
  styles: 'src/sass/'
};

var distAssets = {
  images: 'images/',
  js: 'js/',
  styles: 'css/'
};

/********** TASKS ***************/

gulp.task('default', function () {
  console.log('');
  console.log('Cleaning tasks'.yellow);
  console.log('gulp ' + 'clean:styles'.cyan + '                        ' + '# Clean css files from css directory'.grey);
  console.log('gulp ' + 'clean:images'.cyan + '                        ' + '# Clean image files from images directory'.grey);
  console.log('');
  console.log('Compiling tasks'.yellow);
  console.log('gulp ' + 'imagemin'.cyan + '                            ' + '# Minifiy your images in ./src/images into ./images'.grey);
  console.log('gulp ' + 'styles:dev'.cyan + '                      ' + '# Compile expanded css except "pages" directory and create a maps file.'.grey);
  console.log('gulp ' + 'styles:pro'.cyan + '                      ' + '# Compile compressed css except "pages" directory, apply autoprefixer to result.'.grey);
  console.log('');
  console.log('Debugging tasks'.yellow);
  console.log('gulp ' + 'sasslint'.cyan + '                            ' + '# Check sass files looking for a bad code practises .'.grey);
  console.log('gulp ' + 'jshint'.cyan + '                              ' + '# Check js files looking for a wrong syntaxis.'.grey);
  console.log('');
  console.log('Watching tasks'.yellow);
  console.log('gulp ' + 'watch'.cyan + '                              ' + '# Run a defined tasks if any specified files are changed.'.grey);
  console.log('gulp ' + 'watch -h'.cyan + ' yourhost'.green + '       ' + '# Modifies your host to use BrowserSync.'.grey);
  console.log('gulp ' + 'browsersync'.cyan + '                        ' + '# Synchronize browser and device in realtime and reload browser if any specified files are changed.'.grey);
  console.log('');
  console.log('Developing task'.yellow);
  console.log('gulp ' + 'dev:watch'.cyan + '                          ' + '# Run a development task list: imagemin, styles:dev, pagesStyles:dev and watch.'.grey);
  console.log('gulp ' + 'dev:browser'.cyan + '                        ' + '# Run a development task list: imagemin, styles:dev, pagesStyles:dev and browserSync.'.grey);
  console.log('gulp ' + 'pro'.cyan + '                                ' + '# Run a production task list: imagemin, styles:pro, pagesStyles:pro, sassdoc.'.grey);
  console.log('');
  console.log('Watching task example'.yellow);
  console.log('gulp ' + 'watch -h'.cyan + ' localhost'.green + '      ' + '# To configure hosts as davinci.local.'.grey);
  console.log('');
});


/************* CLEANING *****************/

// Clean css
gulp.task('clean:styles', function () {
  return del([
    distAssets.styles + '*.css',
    distAssets.styles + 'maps/*.css',
  ]).then(paths => {
    console.log('Deleting css from:', distAssets.styles.magenta, '\n', paths.join('\n').magenta);
  });
});

// Clean images
gulp.task('clean:images', function () {
  return del([
    distAssets.images + '**/*',
    '!' + distAssets.images + '*.txt',
    '!' + distAssets.images + '*.md'
  ]).then(paths => {
    console.log('Deleting images from:', distAssets.images.magenta, '\n', paths.join('\n').magenta);
  });
});

/************* COMPILING *****************/

// Minify images
gulp.task('imagemin', () =>
  gulp.src(srcAssets.images + '**/*')
  .pipe(changed(distAssets.images))
  .pipe(imagemin([
    imagemin.gifsicle({
      interlaced: true
    }),
    imagemin.jpegtran({
      progressive: true
    }),
    imagemin.optipng({
      optimizationLevel: 5
    }),
    imagemin.svgo({
      plugins: [{
          removeViewBox: true
        },
        {
          cleanupIDs: false
        }
      ]
    })
  ], {
    verbose: true
  }))
  .pipe(gulp.dest(distAssets.images))
);

// Main styles to development
gulp.task('styles:dev', function () {
  return gulp.src([
    srcAssets.styles + '**/*.s+(a|c)ss'
  ])
  .pipe(sourceMaps.init())
  .pipe(sassGlob())
  .pipe(sass({
    errLogToConsole: true,
    outputStyle: 'expanded'
  }).on('error', sass.logError))
  .pipe(sourceMaps.write('maps'))
  .pipe(gulp.dest(distAssets.styles))
  .pipe(browserSync.stream());
});

// Main styles to producction
gulp.task('styles:pro', function () {
  return gulp.src([
    srcAssets.styles + '**/*.s+(a|c)ss'
  ])
  .pipe(sassGlob())
  .pipe(sass({
    errLogToConsole: true,
    outputStyle: 'compressed'
  }).on('error', sass.logError))
  .pipe(postCss([
    autoprefixer()
  ]))
  .pipe(gulp.dest(distAssets.styles));
});

/************* DEBUGGING *****************/

// Sass lint
gulp.task('sasslint', function () {
  return gulp.src(srcAssets.styles + '**/*.s+(a|c)ss')
    .pipe(sassLint({
      options: {
        configFile: 'mytheme.sass-lint.yml'
      }
    }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
});

// jsHint
gulp.task('jshint', function () {
  return gulp.src([distAssets.js + '*.js'])
  .pipe(jsHint())
  .pipe(jsHint.reporter(jsHintStylish))
  .pipe(browserSync.stream());
});

/************** DEMONS **********************/

// Watch
gulp.task('watch', function () {
  gulp.watch(srcAssets.styles + '**/*.s+(a|c)ss', ['styles:dev']).on('change', function (event) {
    console.log('');
    console.log('-> File ' + event.path.magenta.bold + ' was ' + event.type.green + ', running tasks css...');
  });

  gulp.watch(distAssets.js + '**/*.js', ['jshint'])
    .on('change', function (event) {
      console.log('');
      console.log('-> File ' + event.path.yellow + ' was ' + event.type.green + ', running tasks js...');
    });

  gulp.watch(srcAssets.images + '**/*', ['imagemin'])
    .on('change', function (event) {
      console.log('');
      console.log('-> File ' + event.path.yellow + ' was ' + event.type.green + ', running tasks images...');
    });

});

// Browser Sync
gulp.task('browsersync', function () {
  var openPath = 'local';
  if (process.h) {
    path = process.h;
    openPath = 'external';
    console.log(color.green(path) + ' configured as new hosts.'.yellow);
  }
  browserSync.init({
    host: path,
    open: openPath,
    proxy: path
  });
  gulp.watch(srcAssets.styles + '**/*.s+(a|c)ss', ['styles:dev'])
    .on('change', function (event) {
      console.log('');
      console.log('-> File ' + event.path.magenta.bold + ' was ' + event.type.green + ', running tasks...');
    });
});

/************* QA - CODE QUALITY REPORTS *************/

// DEVELOPER, sasslint report HTML
gulp.task('sassLintReport', function () {
  const fs = require('fs');
  var file = fs.createWriteStream('reports/sassLintResult.html');
  return gulp.src('src/sass/**/*.sass')
    .pipe(sassLint({
      options: {
        configFile: 'mytheme.sass-lint.yml',
        formatter: 'html'
      }
    }))
    .pipe(sassLint.format(file));
    stream.on('finish', function () {
    file.end();
    });
    return stream;
});

// DEVELOPER, jsHint report HTML
gulp.task('jsHintReport', function () {
  return gulp.src([distAssets.js + '*.js'])
    .pipe(jsHint({
      options: {
        configFile: '.jshintrc',
        reporter: 'checkstyle'
      }
    }))
    .pipe(jsHint.reporter('gulp-jshint-html-reporter', {
      filename: 'reports/jshintResult.html',
      createMissingFolders: false
    }))
    .pipe(browserSync.stream());
});

/************** TIME TO WORK ***********************/

// Development enviroment
gulp.task('dev:watch', ['imagemin', 'styles:dev', 'watch']);
gulp.task('dev:browsersync', ['imagemin', 'styles:dev', 'browsersync']);

// Production enviroment
gulp.task('pro', ['imagemin', 'styles:pro']);
