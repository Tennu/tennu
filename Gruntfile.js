module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        "jasmine-node" : {
            run: {
                spec: 'spec'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine-node');

    grunt.registerTask('test', ['jasmine-node']);
    grunt.registerTask('default', ['test']);
};