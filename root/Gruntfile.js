module.exports = function(grunt) {
  require('jit-grunt')(grunt, {
    sftp: 'grunt-ssh'
  });

  grunt.initConfig({
    secret: grunt.file.exists('secret.json')
      ? grunt.file.readJSON('secret.json')
      : null,

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
          basePath: 'src',
          sourceMap: true
        }
      }
    },
    develop: {
      server: {
        file: 'app/app.js',
        nodeArgs: ['--debug']
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
          'app/': [
            'app/**',
            '!app/log/**', '!app/node_modules/**'
          ]
        },
        options: {
          createDirectories: true,
          srcBasePath: 'app/',
          host: '<%= secret.host %>',
          port: '<%= secret.port %>',
          username: '<%= secret.username %>',
          privateKey: '<%= grunt.file.read(secret.privateKeyPath) %>',
          passphrase: '<%= secret.passphrase %>',
          path: '<%= secret.path %>'
        }
      }
    }
  });

  grunt.registerTask('default', [
    'build',
    'develop',
    'watch'
  ]);

  grunt.registerTask('build', [
    'tsd',
    'typescript'
  ])

  grunt.registerTask('deploy', [
    'sftp'
  ]);
};