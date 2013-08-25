module.exports = function(grunt) {
  var serverJs = ['src/app.ts', 'src/common/**/*.ts', 'src/http/**/*.ts'];
  var clientJs = ['src/public/**/*.ts'];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js',
        nodeArgs: ['--debug'], // optional
        args: [8080]
      }
    },
    watch: {
      jade: {
        files: ['src/public/**/*.jade'],
        tasks: ['jade'],
        options: {
          livereload: true
        }
      },
      stylus: {
        files: ['src/public/stylesheets/*.styl'],
        tasks: ['stylus'],
        options: {
          livereload: true
        }
      },
      typescript_server: {
        files: serverJs,
        tasks: ['typescript'],
        options: {
          livereload: true
        }
      },
      typescript_client: {
        files: clientJs,
        tasks: ['typescript:client'],
        options: {
          livereload: true
        }
      },
      public: {
        files: ['public/*.*'],
        options: {
          livereload: true
        }
      }
    },
    jade: {
      release: {
        files: grunt.file.expandMapping(
          ['src/public/**/*.jade'], 'public/', {
            rename: function(destBase, destPath) {
              return destBase + destPath.replace(/^src\/public\//, '').replace(/\.jade$/, ".html");
            }
          }
        )
      },
      debug: {
        options: {
          data: {
            debug: true
          }
        },
        files: grunt.file.expandMapping(
          ['src/public/**/*.jade'], 'public/', {
            rename: function(destBase, destPath) {
              return destBase + destPath.replace(/^src\/public\//, '').replace(/\.jade$/, ".html");
            }
          }
        )
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
      server: {
        src: serverJs,
        dest: '',
        options: {
          module: 'commonjs', //          module: 'amd', //or commonjs
          target: 'es5', //or es3
          base_path: 'src',
          sourcemap: true,
          fullSourceMapPath: true
          //          declaration: true
        }
      },
      client: {
        src: clientJs,
        dest: '',
        options: {
          module: 'amd', //          module: 'amd', //or commonjs
          target: 'es5', //or es3
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
            'express', 'node', 'angular', 'jquery', 'requirejs', 'socket.io'
          ];
          return 'tsd install ' + dependencies.join(' ');
        }
      },
      deploy: {
        cmd: 'deploy.bat'
      }
    },
    copy: {
      deploy: {
        files: [{
          expand: true,
          src: [
            'public/**',
            '**/*.js', 'package.json',
            '!dist/**', '!node_modules/**', '!Gruntfile.js', '!**/*.map'
          ],
          dest: 'dist/',
          filter: 'isFile'
        }]
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
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jade');

  grunt.registerTask('default', [
    'debug-build',
    'develop',
    'watch'
  ]);
  grunt.registerTask('deploy', [
    'release-build',
    'copy',
    'exec:deploy'
  ]);
  grunt.registerTask('debug-build', [
    'jade:debug',
    'stylus',
    'typescript',
  ]);
  grunt.registerTask('release-build', [
    'jade:release',
    'stylus',
    'typescript',
  ]);
};