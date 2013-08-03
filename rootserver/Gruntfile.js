module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    secret: grunt.file.readJSON('secret.json'),
    watch: {
      ts: {
        files: ['src/**/*.ts'],
        tasks: ['typescript', 'develop'],
        options: {
          nospawn: true
        }
      }
    },
    develop: {
      server: {
        file: 'app.js',
        nodeArgs: ['--debug'],
        args: [7140, 7141]
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
            'node'
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
            '**/*.js', 'package.json',
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
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-ssh');

  grunt.registerTask('default', [
    'typescript',
    'develop',
    'watch'
  ]);

  grunt.registerTask('deploy', [
    'typescript',
    'copy',
    'sftp'
  ]);
};