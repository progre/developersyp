module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  grunt.initConfig({
    secret: grunt.file.readJSON('secret.json'),

    shell: {
      tsd: {
        command: function() {
          var dependencies = [
            'node', 'socket.io'
          ];
          return 'tsd install ' + dependencies.join(' ');
        }
      }
    },
    typescript: {
      base: {
        src: ['src/**/*.ts'],
        dest: 'app/',
        options: {
          module: 'commonjs',
          target: 'es5',
          basePath: 'src'
        }
      }
    },
    develop: {
      server: {
        file: 'app/app.js',
        nodeArgs: ['--debug'],
        args: [7140, 7180]
      }
    },
    watch: {
      ts: {
        files: ['src/**/*.ts'],
        tasks: ['typescript', 'develop'],
        options: {
          nospawn: true
        }
      }
    },
    sftp: {
      deploy: {
        files: {
          "app/": "app/**"
        },
        options: {
          createDirectories: true,
          srcBasePath: 'app/',
          host: '<%= secret.host %>',
          port: '<%= secret.port %>',
          username: '<%= secret.username %>',
          privateKey: grunt.file.read((process.env.HOME || process.env.USERPROFILE) + '/.ssh/id_rsa'),
          passphrase: '<%= secret.passphrase %>',
          path: '<%= secret.path %>'
        }
      }
    }
  });

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