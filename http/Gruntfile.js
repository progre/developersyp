module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  var serverJs = ['src/server.ts', 'src/common/**/*.ts', 'src/http/**/*.ts'];
  var clientJs = ['src/public/**/*.ts'];

  grunt.initConfig({
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
    tsd: {
      refresh: {
        options: {
          command: 'reinstall',
          latest: true,
          config: 'tsd.json'
        }
      }
    },
    typescript: {
      server: {
        src: serverJs,
        dest: '',
        options: {
          module: 'commonjs',
          target: 'es5',
          basePath: 'src',
          sourceMap: true
        }
      },
      client: {
        src: clientJs,
        dest: '',
        options: {
          module: 'amd',
          target: 'es5',
          basePath: 'src',
          sourceMap: true
        }
      }
    },
    develop: {
      server: {
        file: 'server.js',
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
    },
    shell: {
      deploy: {
        command: 'deploy.bat'
      }
    }
  });

  grunt.registerTask('default', [
    'debug-build',
    'develop',
    'watch'
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
  grunt.registerTask('deploy', [
    'release-build',
    'copy',
    'exec:deploy'
  ]);
};