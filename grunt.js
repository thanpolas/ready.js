module.exports = function(grunt)
{

  grunt.loadNpmTasks('grunt-closure-tools');

  // Project configuration.
  grunt.initConfig({

    concat: {
      node: {
        src: ['lib/ready.node.js', 'lib/ready.js', 'lib/ready.export.js'],
        dest: 'dist/ready.node.js'
      },
      nodeTests: {
        src: ['node_modules/qunit2node/lib/qunit2node.js', 'test/unit/ready.test.js'],
        dest: 'test/unit/ready.node.test.js'
      }
    },

    closureBuilder: {
      compile: {
        closureLibraryPath: 'closure-library',
        inputs: ['lib/ready.export.js'],
        namespaces: ['ss.ready', 'ss.ready.compiled'],
        root: ['lib/', 'closure-library'],
        compile: true,
        compiler: '../../closure-compiler/superstartup-compiler/build/sscompiler.jar',
        output_file: 'dist/ready.min.js',
        compiler_options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          define: ["'goog.DEBUG=false'", "'ss.STANDALONE=true'"],
          externs: 'build/node.extern.js',
          warning_level: 'verbose',
          summary_detail_level: 3,
          output_wrapper: '(function(){%output%}).call(this);'
        }
      }
    },
    qunit: {
     files: 'test/index.html'
    },
    test: {
      all: 'test/unit/ready.node.test.js'
    }
 });

  // Default task.
  grunt.registerTask('default', 'closureBuilder:compile concat test');

  // node concat and test ops
  grunt.registerTask('nodetest', 'concat test');

};
