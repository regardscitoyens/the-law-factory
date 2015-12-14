
var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var templateCache = require('gulp-angular-templatecache');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var del = require('del');
var url = require('url');
var gzip = require('gulp-gzip');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('browserify-ngannotate');

var global = {isProd: false};

var config = {
    browserPort: 3000,
    UIPort: 3001,
    sourceDir: './public/',
    buildDir: './build/',
    styles: {
        src: 'public/css/**/*.css',
        dest: 'build/css'
    },
    scripts: {
        src: 'public/js/**/*.js',
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
    assetExtensions: ['js', 'css', 'png', 'eot', 'ttc', 'ttf', 'woff2?'],
    views: {
        index: 'public/index.html',
        src: 'public/templates/*.html',
        dest: 'public/js',
        watch: ['public/index.html', 'public/templates/*.html']
    },
    gzip: {
        src: 'build/**/*.{html,xml,json,css,js}',
        dest: 'build/',
        options: {}
    },
    browserify: {
        bundleName: 'main.js',
        prodSourcemap: false
    }
};

function createSourcemap() {
    return !global.isProd || config.browserify.prodSourcemap;
}

gulp.task('browserify', function() {
    var bundler = browserify({
        entries: [config.sourceDir + 'js/app.js'],
        debug: createSourcemap(),
        cache: {},
        packageCache: {},
        fullPaths: !global.isProd
    }), sourceMapLocation = global.isProd ? './' : '';

    return bundler
        .transform(ngAnnotate, {})
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulpif(createSourcemap(), buffer()))
        .pipe(gulpif(createSourcemap(), sourcemaps.init({ loadMaps: true })))
        .pipe(gulpif(createSourcemap(), sourcemaps.write(sourceMapLocation)))
        .pipe(gulp.dest(config.scripts.dest))
        .pipe(browserSync.stream());
});

gulp.task('browserSync', function() {
    var DEFAULT_FILE = 'index.html',
        ASSET_EXTENSION_REGEX = new RegExp("\\b(?!\\?)\\.(html|js|css|png|eot|ttc|ttf|woff2?|svg|ico)\\b(?!\\.)", 'i');

    browserSync.init({
        server: {
            baseDir: config.buildDir,
            middleware: function(req, res, next) {
                var fileHref = url.parse(req.url).href;

                if ( !ASSET_EXTENSION_REGEX.test(fileHref) ) {
                    req.url = '/' + DEFAULT_FILE;
                }

                return next();
            }
        },
        port: config.browserPort,
        ui: {
            port: config.UIPort
        },
        ghostMode: {
            links: false
        }
    });

});

// Views task
gulp.task('views', function() {
    // Put our index.html in the dist folder
    gulp.src(config.views.index)
        .pipe(gulp.dest(config.buildDir));

    // Process any other view files from app/views
    return gulp.src(config.views.src)
        .pipe(templateCache({
            standalone: true
        }))
        .pipe(gulp.dest(config.views.dest))
        .pipe(browserSync.stream());

});

gulp.task('styles', function() {
    return gulp.src(config.styles.src)
        .pipe(concat('main.css'))
        .pipe(gulp.dest(config.styles.dest))
        .pipe(browserSync.stream());
});

gulp.task('fonts', function() {
    return gulp.src(config.fonts.src)
        .pipe(changed(config.fonts.dest))
        .pipe(gulp.dest(config.fonts.dest))
        .pipe(browserSync.stream());
});

gulp.task('images', function() {
    return gulp.src(config.images.src)
        .pipe(changed(config.images.dest))
        .pipe(gulp.dest(config.images.dest))
        .pipe(browserSync.stream());
});

gulp.task('watch', ['browserSync'], function() {
    gulp.watch(config.styles.src, ['styles']);
    gulp.watch(config.fonts.src,   ['fonts']);
    gulp.watch(config.images.src,  ['images']);
    gulp.watch(config.views.watch, ['views']);
});

gulp.task('gzip', function() {
    return gulp.src(config.gzip.src)
        .pipe(gzip(config.gzip.options))
        .pipe(gulp.dest(config.gzip.dest));
});

gulp.task('clean', function() {
    return del([config.buildDir]);
});

gulp.task('dev', ['clean'], function(cb) {
    runSequence(['styles', 'fonts', 'images', 'views', 'browserify'], 'watch', cb);
});

gulp.task('prod', ['clean'], function(cb) {
    cb = cb || function() {};
    global.isProd = true;
    runSequence(['styles', 'images', 'fonts', 'views'], 'browserify', 'gzip', cb);
});