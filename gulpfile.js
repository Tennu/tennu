const gulp = require("gulp");
const rename = require("gulp-rename")
const concat = require("gulp-concat-util");

gulp.task("default", function() {
  console.log("Use the 'build' task.");
});

gulp.task("build", function () {
    gulp.src("src/lib/**/*.sjs")
    .pipe(rename(function (path) {
        path.extname = ".js";
    }))
    .pipe(gulp.dest("lib"));

    gulp.src("src/plugin/**/*.sjs")
    .pipe(rename(function (path) {
        path.extname = ".js";
    }))
    .pipe(gulp.dest("tennu_plugins"));

    gulp.src("src/test/**/*.sjs")
    .pipe(rename(function (path) {
        path.extname = ".js";
    }))
    .pipe(gulp.dest("test"))

    gulp.src("src/bin/**/*.sjs")
    .pipe(concat.header("#! /usr/bin/env node\n\n"))
    .pipe(rename(function (path) {
        path.extname = ".js";
    }))
    .pipe(gulp.dest("bin"))
});