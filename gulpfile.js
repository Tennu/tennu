var gulp = require('gulp');
var sweetjs = require("gulp-sweetjs");

gulp.task('default', function() {
  // place code for your default task here
});

// 'sparkler/macros' 'sweet-bdd'
gulp.task("build", function() {
    gulp.src("src/lib/**/*.js")
    //.pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: [],
        readableNames: true
    }))
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('lib'));

    gulp.src("src/plugin/**/*.sjs")
    //.pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: ['sparkler/macros'],
        readableNames: true
    }))
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('tennu_plugins'));

    gulp.src("src/test/**/*.sjs")
    //.pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: ['sweet-bdd'],
        readableNames: true
    }))
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('test'));
});