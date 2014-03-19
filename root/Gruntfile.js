module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  grunt.initConfig({
    secret: grunt.file.readJSON('secret.json'),

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
      base: {
        src: ['src/**/*.ts'],
        dest: 'app/',
        options: {
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