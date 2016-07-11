var gulp = require("gulp");
var ngmin = require("gulp-ngmin");
var concat = require("gulp-concat");
var minify = require("gulp-minify");
var cleanCSS = require("gulp-clean-css");

gulp.task("default", function(){
  gulp.start("copyimgs");
  gulp.start("copyjslibs");
  gulp.start("copycsslibs");
  gulp.start("minifyjs");
  gulp.start("minifycss");

})

//concat and minify scripts
gulp.task("minifyjs", function() {
  gulp.src(["public/js/**/*.js", "!public/js/lib/*"])
      .pipe(concat("brmovies.js"))
      .pipe(ngmin())
      .pipe(minify({
        ext: {
          src: ".js",
          min: ".min.js"
        }
      }))
      .pipe(gulp.dest("dist/js"));

});

//copy pre-minifies libraries
gulp.task("copyjslibs", function() {
  gulp.src("public/js/lib/*.js")
      .pipe(gulp.dest("dist/js"));
});

gulp.task("minifycss", function() {
  gulp.src(["public/css/**/*.css", "!public/css/lib/*"])
      .pipe(cleanCSS())
      .pipe(gulp.dest("dist/css"));
});

gulp.task("copycsslibs", function() {
  gulp.src("public/css/lib/*.css")
      .pipe(gulp.dest("dist/css"));
});

gulp.task("copyimgs", function() {
  gulp.src("public/imgs/*")
      .pipe(gulp.dest("dist/imgs"));
})
