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
      buildNode: {
        closureLibraryPath: 'closure-library',
        inputs: ['lib/ready.export.js'],
        output_file: 'dist/ready.node.js',
        root: ['lib/', 'closure-library/'],
        output_mode: 'script'
      },
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
      },
      compileNode: {
        closureLibraryPath: 'closure-library',
        inputs: ['lib/ready.export.js'],
        namespaces: ['ss.ready', 'ss.ready.compiled'],
        root: ['lib/', 'closure-library'],
        compile: true,
        compiler: '../../closure-compiler/superstartup-compiler/build/sscompiler.jar',
        output_file: 'dist/ready.node.min.js',
        compiler_options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          define: ["'goog.DEBUG=false'", "'ss.STANDALONE=true'", "'NODEJS=true'"],
          warning_level: 'verbose',
          externs: 'build/node.extern.js',
          summary_detail_level: 3,
          formatting: 'PRETTY_PRINT'
        }
      }
    },
    closureDepsWriter: {
       // any name that describes your operation
       targetName: {
        closureLibraryPath: 'closure-library', // path to closure library
        files: ['lib/ready.js', 'lib/ready.export.js'],
        output_file: 'lib/deps.js'
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
  grunt.registerTask('default', 'closureBuilder:compile');

  // node concat ops
  grunt.registerTask('nodecat', 'concat:node concat:nodeTests');

  // node concat and test ops
  grunt.registerTask('nodetest', 'nodecat test');

};
