module.exports = (grunt) ->
    'use strict'
    # Project configuration.
    grunt.initConfig
        pkg: grunt.file.readJSON 'package.json'
        
        coffeelint:
            options: grunt.file.readJSON('.coffeelint')
            all: ['**/*.coffee', '!build/**/*.coffee', '!node_modules/**/*.coffee', '!public/**/*.coffee']
        
        # Before generating any new files, remove any previously-created files.
        clean:
            build:
                src: ['build']
            stylesheets:
                src: ['build/**/*.css', '!build/application.css']
            scripts:
                src: ['build/**/*.js', '!build/application.js']
        
        copy:
            build:
                cwd: 'app'
                src: ['**', '!**/*.scss', '!**/*.coffee', '!**/*.jade']
                dest: 'build'
                expand: true
        
        express:
            options:
                cmd: 'coffee'
                script: 'server.coffee'
            dev:
                options:
                    node_env: 'development'
            prod:
                options:
                    node_env: 'production'
            test:
                options:
                    node_env: 'testing'
        
        coffee:
            build:
                options:
                    join: true
                    sourceMap: true
                files: 'build/application.js': ['app/coffeescript/**/*.coffee']
        
        uglify:
            build:
                options:
                    mangle: false
                files:
                    'public/js/application.js': ['build/**/*.js']
        
        sass:
            build:
                options:
                    style: 'compressed'
                files: [
                    'build/stylesheets/screen.css': ['app/sass/screen.scss'],
                    'build/stylesheets/print.css': ['app/sass/print.scss'],
                    'build/stylesheets/ie.css': ['app/sass/ie.scss']
                ]
        
        autoprefixer:
            build:
                expand: true
                cwd: 'build'
                src: [ '**/*.css' ]
                dest: 'build'
        
        cssmin:
            build:
                files: [
                    'public/stylesheets/screen.css': ['build/stylesheets/screen.css'],
                    'public/stylesheets/print.css': ['build/stylesheets/print.css'],
                    'public/stylesheets/ie.css': ['build/stylesheets/ie.css']
                ]
        
        # Configuration to be run.
        emberTemplates:
            build:
                options:
                    templateBasePath: 'app/templates/'
                files: [
                    expand: true
                    cwd: 'app'
                    src: ['templates/**/*.hbs']
                    dest: 'build'
                    ext: '.js'
                ]
        
        # Watch for file changes.
        watch:
            options:
                livereload: true
            express:
                options:
                    spawn: false
                files: ['*.coffee', 'models/**/*.coffee', 'routes/**/*.coffee']
                tasks: ['express:dev']
            scripts:
                files: 'app/coffeescript/**/*.coffee'
                tasks: ['scripts']
            stylesheets:
                files: 'app/sass/**/*.scss'
                tasks: ['stylesheets']
            emberTemplates:
                files: 'app/templates/**/*.hbs'
                tasks: ['scripts']
            copy:
                files: ['app/**', '!app/**/*.styl', '!app/**/*.coffee', '!views/**/*.jade']
                tasks: ['copy']
            
        
        # Unit tests.
        nodeunit:
            all: ['tests/**/*_test.coffee']
    
    # Actually load this plugin's task(s).
    grunt.loadTasks 'tasks'

    # The clean plugin helps in testing.
    grunt.loadNpmTasks 'grunt-autoprefixer'
    grunt.loadNpmTasks 'grunt-coffeelint'
    grunt.loadNpmTasks 'grunt-contrib-clean'
    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-concat'
    grunt.loadNpmTasks 'grunt-contrib-copy'
    grunt.loadNpmTasks 'grunt-contrib-cssmin'
    grunt.loadNpmTasks 'grunt-contrib-nodeunit'
    grunt.loadNpmTasks 'grunt-contrib-sass'
    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-contrib-watch'
    grunt.loadNpmTasks 'grunt-ember-templates'
    grunt.loadNpmTasks 'grunt-express-server'
    
    # Compile javascript.
    grunt.registerTask 'scripts', 'Compiles the javascript.', ['coffee', 'emberTemplates', 'uglify', 'clean:scripts']
    
    # Compile stylesheets.
    grunt.registerTask 'stylesheets', 'Compiles the stylesheets.',
        ['sass', 'autoprefixer', 'cssmin', 'clean:stylesheets']
    
    # Compile static assets.
    grunt.registerTask 'build', 'Compiles all of the assets and copies the files to the build directory.',
        ['clean:build', 'copy', 'scripts', 'stylesheets']

    # Whenever the "test" task is run, first clean the "build" dir, then run this.
    grunt.registerTask 'test', 'Run tests on the application', ['coffeelint', 'nodeunit']
    
    # Run the tasks to build, spin up a server and watch
    grunt.registerTask 'server', 'Watches the project for changes, automatically builds them and runs a server.',
        ['build', 'express:dev', 'watch']
    
    # Default task.
    grunt.registerTask 'default', 'server'