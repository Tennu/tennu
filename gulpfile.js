var gulp = require('gulp');
var sweetjs = require("gulp-sweetjs");
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat-util');

gulp.task('default', function() {
  console.log("Use either the 'build' or 'test' tasks");
});

gulp.task("build", function () {
    function pipeline (from, to, macros) {
        gulp.src("src/" + from + "/**/*.sjs")
        .pipe(sourcemaps.init())
        .pipe(sweetjs({
            modules: macros,
            readableNames: true
        }))
        .pipe(sourcemaps.write("../sourcemaps/" + from))
        .pipe(gulp.dest(to))
    }

    pipeline("lib", "lib", []);
    pipeline("plugin", "tennu_plugins", ['sparkler/macros', 'lambda-chop/macros']);
    pipeline("test", "test", ['sweet-bdd']);
    pipeline("bin", "bin", []);

    gulp.src("src/bin/**/*.sjs")
    .pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: [],
        readableNames: true
    }))
    .pipe(concat.header("#! /usr/bin/env node\n\n"))
    .pipe(sourcemaps.write("../sourcemaps/bin"))
    .pipe(gulp.dest("bin"))
});