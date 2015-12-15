
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var del = require('del');
var url = require('url');
var gulpif = require('gulp-if');
var order = require('gulp-order');
var sourcemaps = require('gulp-sourcemaps');

var config = {
    debug: true,
    browserPort: 3000,
    UIPort: 3001,
    sourceDir: './public/',
    buildDir: './build/',
    styles: {
        src: 'public/css/**/*.css',
        dest: 'build/css'
    },
    appScripts: {
        src: ['public/js/modules/*.js', 'public/js/*.js'],
        dest: 'build/js'
    },
    externalScripts: {
        src: [
            'public/js/lib/d3-3.4.13.min.js',
            'public/js/lib/jquery-1.11.3.min.js',
            'public/js/lib/jquery-ui-1.11.4.custom.min.js',
            'public/js/lib/bootstrap-3.3.6.min.js',
            'public/js/lib/d3-bootstrap-plugins.js',
            'public/js/lib/angular-1.4.8.min.js',
            'public/js/lib/angular-ui-router-0.2.15.min.js',
            'public/js/lib/spin-2.0.1.min.js',
            'public/js/lib/intro-0.9.min.js'
            ],
        dest: 'build/js'
    },
    images: {
        src: 'public/img/**/*',
        dest: 'build/img'
    },
    fonts: {
        src: ['public/fonts/**/*'],
        dest: 'build/fonts'
    },
    views: {
        index: 'public/index.prod.html',
        src: 'public/templates/*.html',
        dest: 'build/templates'
    },
    gzip: {
        src: 'build/**/*.{html,xml,json,css,js}',
        dest: 'build/',
        options: {}
    }
};

gulp.task('appScripts', function() {
    return gulp.src(config.appScripts.src)
        .pipe(gulpif(config.debug, sourcemaps.init()))
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.appScripts.dest));
});

gulp.task('externalScripts', function() {
    return gulp.src(config.externalScripts.src)
        .pipe(concat('external-libs.js'))
        .pipe(gulp.dest(config.externalScripts.dest));
});

gulp.task('views', function() {
    gulp.src(config.views.index)
        .pipe(concat('index.html'))
        .pipe(gulp.dest(config.buildDir));

    gulp.src(config.views.src)
        .pipe(gulp.dest(config.views.dest));
});

gulp.task('styles', function() {
    return gulp.src(config.styles.src)
        .pipe(concat('main.css'))
        .pipe(gulp.dest(config.styles.dest));
});

gulp.task('fonts', function() {
    return gulp.src(config.fonts.src)
        .pipe(changed(config.fonts.dest))
        .pipe(gulp.dest(config.fonts.dest));
});

gulp.task('images', function() {
    return gulp.src(config.images.src)
        .pipe(changed(config.images.dest))
        .pipe(gulp.dest(config.images.dest));
});

gulp.task('clean', function() {
    return del([config.buildDir]);
});

gulp.task('build', ['clean'], function(cb) {
    cb = cb || function() {};
    runSequence(['styles', 'images', 'fonts', 'views', 'externalScripts', 'appScripts'], cb);
});