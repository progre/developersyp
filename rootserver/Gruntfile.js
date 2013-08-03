module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      ts: {
        files: ['src/**/*.ts'],
        tasks: ['typescript', 'develop'],
        options: { nospawn: true }
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
    }
  });
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', [
    'typescript',
    'develop',
    'watch'
  ]);
};