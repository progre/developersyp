module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    secret: grunt.file.readJSON('secret.json'),
    develop: {
      server: {
        file: 'app.js',
        nodeArgs: ['--debug'], // optional
        args: [8080]
      }
    },
    watch: {
      ts: {
        files: [
          'src/**/*.ts'
        ],
        tasks: ['typescript']
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
            'express', 'node'
          ];
          return 'tsd install ' + dependencies.join(' ');
        }
      }
    },
    copy: {
      deploy: {
        files: [{
          expand: true,
          src: [
            'public/**', 'views/**', '**/*.js', 'package.json',
            '!dist/**', '!node_modules/**', '!Gruntfile.js'
          ],
          dest: 'dist/',
          filter: 'isFile'
        }]
      }
    },
    sftp: {
      deploy: {
        files: {
          "dist/": "dist/**"
        },
        options: {
          createDirectories: true,
          srcBasePath: 'dist/',
          host: '<%= secret.host %>',
          port: '<%= secret.port %>',
          username: '<%= secret.username %>',
          privateKey: grunt.file.read(process.env['HOME'] + '/.ssh/id_rsa'),
          passphrase: '<%= secret.passphrase %>',
          path: '<%= secret.path %>'
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
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-ssh');

  grunt.registerTask('default', [
    'livereload-start',
    'stylus',
    'typescript',
    'develop',
    'watch'
  ]);

  grunt.registerTask('deploy', [
    'stylus',
    'typescript',
    'copy',
    'sftp'
  ]);
};