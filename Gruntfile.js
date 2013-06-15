module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-typescript');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js'
      }
    },
    regarde: {
      js: {
        files: [
          'app.js',
          'routes/*.js'
        ],
        tasks: ['develop', 'delayed-livereload']
      },
      css: {
        files: ['public/stylesheets/*.css'],
        tasks: ['livereload']
      },
      jade: {
        files: ['views/*.jade'],
        tasks: ['livereload']
      }
    },
    typescript: {
      base: {
        src: ['src/**/*.ts'],
        dest: '',
        options: {
//          module: 'amd', //or commonjs
//          target: 'es5', //or es3
          base_path: 'src',
          sourcemap: true,
          fullSourceMapPath: true,
//          declaration: true
        }
      }
    },
    exec: {
      tsd: {
        cmd: function () {
          var dependencies = [
            'express', 'node'
          ];
          return 'tsd install ' + dependencies.join(' ');
        }
      }
    }
	});
  grunt.registerTask('delayed-livereload', 'delayed livereload', function () {
    var done = this.async();
    setTimeout(function () {
      grunt.task.run('livereload');
      done();
    }, 500);
  });
	grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['livereload-start', 'typescript', 'develop', 'regarde']);
};
