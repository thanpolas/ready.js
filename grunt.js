module.exports = function(grunt)
{

  grunt.loadNpmTasks('grunt-closure-tools');
  
  // Project configuration.
  grunt.initConfig({
    closureBuilder: {
      build: {
        closureLibraryPath: 'closure-library',
        inputs: ['lib/name.export.js'],
        output_file: 'build/ready.concatenated.js',
        root: ['lib/', 'closure-library/'],
        output_mode: 'script'
      }
    },
    closureCompiler: {
      target: {
        closureCompiler: '../closure_compiler/superstartup-compiler/build/sscompiler.jar',
        js: ['closure-library/closure/goog/base.js', 'lib/ready.export.js', 'lib/ready.js'],
        output_file: 'dist/ready.min.js',
        options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          warning_level: 'verbose',
          summary_detail_level: 3,
          output_wrapper: '"(function(){%output%}).call(this);"'
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
		}
  });

  // Default task.
  grunt.registerTask('default', 'closureCompiler');
};