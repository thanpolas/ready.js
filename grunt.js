module.exports = function(grunt)
{

  grunt.loadNpmTasks('grunt-closure-tools');

  // Project configuration.
  grunt.initConfig({
    closureBuilder: {
      build: {
        closureLibraryPath: 'closure-library',
        inputs: ['lib/ready.export.js'],
        output_file: 'dist/ready.concat.js',
        root: ['lib/', 'closure-library/'],
        output_mode: 'script'
      },
      compile: {
        closureLibraryPath: 'closure-library',
        inputs: ['lib/ready.export.js'],
        namespaces: ['ss.ready', 'ss.ready.compiled'],
        root: ['lib/', 'closure-library'],
        compile: true,
        compiler:  '../../closure-compiler/superstartup-compiler/build/sscompiler.jar',
        output_file: 'dist/ready.min.js',
        compiler_options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          define: ["'goog.DEBUG=false'", "'ss.STANDALONE=true'"],
          warning_level: 'verbose',
          summary_detail_level: 3,
          output_wrapper: '(function(){%output%}).call(this);'
        }
      },
      node: {
        closureLibraryPath: 'closure-library',
        inputs: ['lib/ready.export.js'],
        namespaces: ['ss.ready', 'ss.ready.compiled'],
        root: ['lib/', 'closure-library'],
        compile: true,
        compiler:  '../../closure-compiler/superstartup-compiler/build/sscompiler.jar',
        output_file: 'dist/ready.node.js',
        compiler_options: {
          compilation_level: 'WHITESPACE_ONLY',
          define: ["'goog.DEBUG=false'", "'ss.STANDALONE=true'"],
          warning_level: 'verbose',
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
     files: "test/index.html"
    },
    test: {
      all: "test/unit/ready.test.js"
    }
 });

  // Default task.
  grunt.registerTask('default', 'closureBuilder:compile');
};