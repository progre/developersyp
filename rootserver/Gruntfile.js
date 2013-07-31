module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js',
        nodeArgs: ['--debug'],
        args: [7140, 7141]
      }
    },
    watch: {
      ts: {
        files: ['src/**/*.ts'],
        tasks: ['typescript']
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
    }
  });
  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', [
    'typescript',
    'develop',
    'watch'
  ]);
};