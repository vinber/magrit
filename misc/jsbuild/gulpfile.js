var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var babel = require('babelify');
var es2015 = require('babel-preset-es2015');
var stage_0 = require('babel-preset-stage-0');

function compile() {
  var bundler = browserify('./index.js', { debug: true }).transform(babel, {
		// Use all of the ES2015 spec
		presets: [es2015, stage_0]
		});

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('build.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./build'));
  }

  rebundle();
}


gulp.task('build', function() { return compile(); });

gulp.task('default', ['build']);
