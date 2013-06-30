module.exports = function(grunt) {
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
      stylus: {
        files: ['src/public/stylesheets/*.styl'],
        tasks: ['stylus', 'delayed-livereload']
      },
      jade: {
        files: ['views/*.jade'],
        tasks: ['livereload']
      }
    },
    stylus: {
      compile: {
        options: {
          urlfunc: 'embedurl'
        },
        files: {
          'public/stylesheets/style.css': 'src/public/stylesheets/style.styl'
        }
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
          fullSourceMapPath: true
          //          declaration: true
        }
      }
    },
    exec: {
      tsd: {
        cmd: function() {
          var dependencies = [
              'express', 'node'
          ];
          return 'tsd install ' + dependencies.join(' ');
        }
      }
    }
  });
  grunt.registerTask('delayed-livereload', 'delayed livereload', function() {
    var done = this.async();
    setTimeout(function() {
      grunt.task.run('livereload');
      done();
    }, 500);
  });
  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', [
      'livereload-start',
      'stylus',
      'typescript',
      'develop',
      'regarde'
  ]);
};