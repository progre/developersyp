module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  var serverJs = ['src/server.ts', 'src/common/**/*.ts', 'src/http/**/*.ts'];
  var clientJs = ['src/public/**/*.ts'];

  var jadeFiles = grunt.file.expandMapping(
    ['src/public/**/*.jade'], 'app/public/', {
      rename: function(destBase, destPath) {
        return destBase + destPath.replace(/^src\/public\//, '').replace(/\.jade$/, ".html");
      }
    }
  );

  grunt.initConfig({
    jade: {
      release: {
        files: jadeFiles
      },
      debug: {
        options: {
          data: { debug: true }
        },
        files: jadeFiles
      }
    },
    stylus: {
      compile: {
        options: {
          urlfunc: 'embedurl'
        },
        files: {
          'app/public/stylesheets/style.css': 'src/public/stylesheets/style.styl'
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
        dest: 'app/',
        options: {
          module: 'commonjs',
          target: 'es5',
          basePath: 'src'
        }
      },
      client: {
        src: clientJs,
        dest: 'app/',
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
        file: 'app/server.js',
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
            'app/public/**', 'app/**/*.js', 'package.json',
            '!**/*.map'
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
    'tsd',
    'typescript',
  ]);
  grunt.registerTask('release-build', [
    'jade:release',
    'stylus',
    'tsd',
    'typescript',
  ]);
  grunt.registerTask('deploy', [
    'release-build',
    'copy',
    'exec:deploy'
  ]);
};