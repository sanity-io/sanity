const path = require('path')
const gulp = require('gulp')
const newer = require('gulp-newer')
const babel = require('gulp-babel')
const watch = require('gulp-watch')
const gutil = require('gulp-util')
const filter = require('gulp-filter')
const plumber = require('gulp-plumber')
const through = require('through2')
const chalk = require('chalk')
const childProcess = require('child_process')

const scripts = './packages/@sanity/*/src/**/*.js'
const assets = './packages/@sanity/*/src/**/*'

let srcEx
let libFragment

if (path.win32 === path) {
  srcEx = /(@sanity\\[^\\]+)\\src\\/
  libFragment = '$1\\lib\\'
} else {
  srcEx = new RegExp('(@sanity/[^/]+)/src/')
  libFragment = '$1/lib/'
}

const mapToDest = orgPath => orgPath.replace(srcEx, libFragment)
const dest = 'packages/@sanity'

gulp.task('default', ['build'])

gulp.task('build', () => {
  const assetFilter = filter(['**/*.js'], {restore: true})

  return gulp.src(assets)
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(newer({map: mapToDest}))
    .pipe(assetFilter)
    .pipe(through.obj((file, enc, callback) => {
      gutil.log('Compiling', `'${chalk.cyan(file.path)}'...`)
      callback(null, file)
    }))
    .pipe(babel())
    .pipe(assetFilter.restore)
    .pipe(through.obj((file, enc, callback) => {
      file._path = file.path
      file.path = mapToDest(file.path)
      callback(null, file)
    }))
    .pipe(gulp.dest(dest))
})

gulp.task('watch-js', () => {
  return gulp.src(scripts)
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(through.obj((file, enc, callback) => {
      file._path = file.path
      file.path = file.path.replace(srcEx, libFragment)
      callback(null, file)
    }))
    .pipe(newer(dest))
    .pipe(through.obj((file, enc, callback) => {
      gutil.log('Compiling', `'${chalk.cyan(file._path)}'...`)
      callback(null, file)
    }))
    .pipe(babel())
    .pipe(gulp.dest(dest))
})

gulp.task('watch-assets', () => {
  return gulp.src(assets)
    .pipe(filter(['**/*.*', '!**/*.js']))
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(through.obj((file, enc, callback) => {
      file._path = file.path
      file.path = file.path.replace(srcEx, libFragment)
      callback(null, file)
    }))
    .pipe(newer(dest))
    .pipe(through.obj((file, enc, callback) => {
      gutil.log('Copying', `'${chalk.cyan(file._path)}'...`)
      callback(null, file)
    }))
    .pipe(gulp.dest(dest))
})

gulp.task('watch', ['watch-js', 'watch-assets'], callback => {
  watch(scripts, {debounceDelay: 200}, () => {
    gulp.start('watch-js')
  })

  watch(assets, {debounceDelay: 200}, () => {
    gulp.start('watch-assets')
  })
})

gulp.task('dev', ['watch-js', 'watch-assets'], cb => {
  watch(scripts, {debounceDelay: 200}, () => {
    gulp.start('watch-js')
  })

  watch(assets, {debounceDelay: 200}, () => {
    gulp.start('watch-assets')
  })

  const projectPath = path.join(__dirname, 'packages', 'example-studio')
  const npmPath = path.join(projectPath, 'node_modules', '.bin')
  const proc = childProcess.spawn('sanity', ['start'], {
    cwd: projectPath,
    env: Object.assign({}, process.env, {
      PATH: [npmPath].concat(process.env.PATH.split(path.delimiter)).join(path.delimiter)
    })
  })

  proc.stdout.pipe(process.stdout)
  proc.stderr.pipe(process.stderr)
})

gulp.task('storybook', ['watch-js', 'watch-assets'], () => {
  watch(scripts, {debounceDelay: 200}, () => {
    gulp.start('watch-js')
  })

  watch(assets, {debounceDelay: 200}, () => {
    gulp.start('watch-assets')
  })
  
  const projectPath = path.join(__dirname, 'packages', 'storybook')
  const npmPath = path.join(projectPath, 'node_modules', '.bin')
  const proc = childProcess.spawn('npm', ['start'], {
    cwd: projectPath,
    env: Object.assign({}, process.env, {
      PATH: [npmPath].concat(process.env.PATH.split(path.delimiter)).join(path.delimiter)
    })
  })

  proc.stdout.pipe(process.stdout)
  proc.stderr.pipe(process.stderr)
})
