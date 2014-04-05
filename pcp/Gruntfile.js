module.exports = function(grunt) {
  require('jit-grunt')(grunt, {
    sftp: 'grunt-ssh'
  });

  grunt.initConfig({
    startAt: dateFormat(getNowJST()),
    secret: grunt.file.exists('secret.json')
      ? grunt.file.readJSON('secret.json')
      : null,

    tsd: {
      build: {
        options: {
          command: 'reinstall',
          config: 'tsd.json'
        }
      },
      refresh: {
        options: {
          command: 'reinstall',
          config: 'tsd.json',
          latest: true
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
          basePath: 'src',
          sourceMap: true
        }
      }
    },
    develop: {
      server: {
        file: 'app/server.js',
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
          all: [
            'package.json', 'app/**',
            '!*.map'
          ]
        },
        options: {
          createDirectories: true,
          host: '<%= secret.host %>',
          port: '<%= secret.port %>',
          username: '<%= secret.username %>',
          privateKey: '<%= grunt.file.read(secret.privateKeyPath) %>',
          passphrase: '<%= secret.passphrase %>',
          path: '<%= secret.path + "/" + "releases" + "/" + startAt %>'
        }
      }
    }
  });

  grunt.registerTask('default', [
    'debug-build',
    'develop',
    'watch'
  ]);

  grunt.registerTask('debug-build', [
    'tsd:refresh',
    'typescript'
  ])

  grunt.registerTask('release-build', [
    'tsd:refresh',
    'typescript'
  ])

  grunt.registerTask('deploy', [
    'release-build',
    'sftp'
  ]);
};

function getNowJST() {
  var date = new Date();
  date.setUTCHours(date.getUTCHours() + 9);
  return date;
}

function dateFormat(date) {
  return ('000' + date.getUTCFullYear()).slice(-4)
    + ('0' + (date.getUTCMonth() + 1)).slice(-2)
    + ('0' + date.getUTCDate()).slice(-2)
    + ('0' + date.getUTCHours()).slice(-2)
    + ('0' + date.getUTCMinutes()).slice(-2)
    + ('0' + date.getUTCSeconds()).slice(-2);
}
