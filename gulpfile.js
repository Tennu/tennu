var gulp = require('gulp');
var sweetjs = require("gulp-sweetjs");
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
  console.log("Use either the 'build' or 'test' tasks");
});

gulp.task("build", function () {
    gulp.src("src/lib/**/*.js")
    // .pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: [],
        readableNames: true
    }))
    // .pipe(sourcemaps.write('../sourcemaps/lib'))
    .pipe(gulp.dest('lib'));

    gulp.src("src/plugin/**/*.sjs")
    // .pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: ['sparkler/macros'],
        readableNames: true
    }))
    // .pipe(sourcemaps.write('../sourcemaps/plugins'))
    .pipe(gulp.dest('tennu_plugins'));

    gulp.src("src/test/**/*.sjs")
    // .pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: ['sweet-bdd'],
        readableNames: true
    }))
    // .pipe(sourcemaps.write('../sourcemaps/test'))
    .pipe(gulp.dest('test'));
});