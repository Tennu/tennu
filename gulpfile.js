const gulp = require('gulp');
const sweetjs = require("gulp-sweetjs");
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat-util');

// Macro packages.
const match = "sparkler/macros";
const lambda = "lambda-chop/macros";
const bdd = "sweet-bdd";

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

    pipeline("lib", "lib", [match, lambda]);
    pipeline("plugin", "tennu_plugins", [match]);
    pipeline("test", "test", [bdd]);

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