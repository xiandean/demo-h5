'use strict'

const gulp = require('gulp')
const autoprefixer = require('gulp-autoprefixer')
const sass = require('gulp-sass')
const cleanCSS = require('gulp-clean-css')
const sourcemaps = require('gulp-sourcemaps')
const plumber = require('gulp-plumber')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const inlinesource = require('gulp-inline-source')
const browserSync = require('browser-sync').create()
const runSequence = require('run-sequence')
const del = require('del')
// const purifycss = require('gulp-purifycss')

const config = require('./gulpfile.config.js')
const webpack = require('webpack-stream')
const webpackConfig = require('./webpack.config.js')

const postcss = require('gulp-postcss');
const adaptive = require('postcss-adaptive');

const processors = [adaptive({
    remUnit: 100,
    baseDpr: 2,
    remPrecision: 6,
    hairlineClass: 'hairlines',
    autoRem: true
})];

gulp.task('html', function () {
  return gulp.src(config.html.src)
    .pipe(gulp.dest(config.html.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('css', function () {
  return gulp.src(config.css.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(autoprefixer({
      browsers: ['iOS >= 7', 'Android >= 4', '> 1%', 'last 2 version']
    }))
    .pipe(postcss(processors))
    // .pipe(cleanCSS())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(config.css.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('cssmin', function () {
  return gulp.src(config.css.src)
    .pipe(autoprefixer({
      browsers: ['iOS >= 7', 'Android >= 4', '> 1%', 'last 2 version']
    }))
    .pipe(postcss(processors))
    .pipe(cleanCSS())
    .pipe(gulp.dest(config.css.dest))
})

gulp.task('sass', function () {
  return gulp.src(config.sass.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['iOS >= 7', 'Android >= 4', '> 1%', 'last 2 version']
    }))
    .pipe(postcss(processors))
    // .pipe(cleanCSS())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(config.sass.dest))
    .pipe(browserSync.reload({ stream: true }))
})
gulp.task('sassmin', function () {
  return gulp.src(config.sass.src)
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['iOS >= 7', 'Android >= 4', '> 1%', 'last 2 version']
    }))
    .pipe(postcss(processors))
    .pipe(cleanCSS())
    .pipe(gulp.dest(config.sass.dest))
})

gulp.task('image', function () {
  return gulp.src(config.image.src)
    .pipe(plumber())
    .pipe(gulp.dest(config.image.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('js', function () {
  return gulp.src('src/entry.js')
    .pipe(plumber())
    .pipe(webpack(Object.assign(webpackConfig, {devtool: 'source-map'})))
    .pipe(gulp.dest(config.js.dest))
    .pipe(browserSync.reload({ stream: true }))
})
gulp.task('jsmin', function () {
  return gulp.src('src/entry.js')
    .pipe(webpack(webpackConfig))
    .pipe(uglify())
    .pipe(gulp.dest(config.js.dest))
})

gulp.task('lib', function () {
  return gulp.src(config.lib.src)
    .pipe(gulp.dest(config.lib.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('clean', function () {
  return del([config.dest])
})

gulp.task('build', function (callback) {
  runSequence('clean', ['html', 'css', 'sass', 'image', 'js', 'lib'], callback)
})

gulp.task('watch', function () {
  gulp.watch(config.html.src, ['html'])
  gulp.watch(config.css.src,['css'])
  gulp.watch(config.sass.src,['sass'])
  gulp.watch(config.image.src, ['image'])
  gulp.watch(config.js.src, ['js'])
  gulp.watch(config.lib.src, ['lib'])
})

gulp.task('server', ['build', 'watch'], function () {
  browserSync.init({
    server: {
      baseDir: config.dest
    },
    // 停止自动打开浏览器
    open: false,
    host: 'xiandean.gd.sina.com.cn'
    // browser: "chrome"
    // browser: ["chrome", "firefox"]
  })
})

gulp.task('inlinesource', function () {
  return gulp.src(config.html.dest + '/*.html')
    .pipe(inlinesource({
      compress: false,
      pretty: false
    }))
    .pipe(gulp.dest(config.html.dest))
})
gulp.task('prod', function (callback) {
  runSequence('clean', ['html', 'cssmin', 'sassmin', 'image', 'jsmin', 'lib'], 'inlinesource', callback)
})

gulp.task('default', ['server'])
