/* eslint-disable import/no-commonjs, import/no-unassigned-import */
// Note: Node 6 compat, please!
require('hard-rejection/register')

const path = require('path')
const childProcess = require('child_process')
const gulp = require('gulp')
const newer = require('gulp-newer')
const babel = require('gulp-babel')
const watch = require('gulp-watch')
const gutil = require('gulp-util')
const filter = require('gulp-filter')
const plumber = require('gulp-plumber')
const ts = require('@rexxars/gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')
const through = require('through2')
const chalk = require('chalk')
const globby = require('globby')
const mergeStream = require('merge-stream')

const isWindows = /^win/.test(process.platform)

const tsPaths = globby.sync(['./packages/@sanity/*/tsconfig.json'])
const tsProjects = tsPaths.map(conf => ts.createProject(conf))
const tsScripts = tsPaths.map(proj => `${path.dirname(proj)}/src/**/*.ts`)
const scripts = ['./packages/@sanity/*/src/**/*.js', './packages/sanity-plugin-*/src/**/*.js']
const assets = ['./packages/@sanity/*/src/**/*', './packages/sanity-plugin-*/src/**/*']
const srcOpts = {base: 'packages'}

const getProjectEnv = projectPath => {
  const npmPath = path.join(projectPath, 'node_modules', '.bin')
  /* eslint-disable no-process-env */
  const paths = [npmPath].concat(process.env.PATH.split(path.delimiter)).filter(Boolean)
  return Object.assign({}, process.env, {
    PATH: paths.join(path.delimiter)
  })
  /* eslint-enable no-process-env */
}

let srcEx
let srcRootEx
let libFragment

if (path.win32 === path) {
  srcEx = /(@sanity\\[^\\]+)\\src\\/
  srcRootEx = /(sanity-plugin-[^\\]+)\\src\\/
  libFragment = '$1\\lib\\'
} else {
  srcEx = new RegExp('(@sanity/[^/]+)/src/')
  srcRootEx = /(sanity-plugin-[^/]+)\/src\//
  libFragment = '$1/lib/'
}

const logCompile = (file, enc, cb) => {
  gutil.log('Compiling', `'${chalk.cyan(file._path || file.path)}'...`)
  cb(null, file)
}

const mapToDest = orgPath => {
  const outPath = orgPath.replace(srcEx, libFragment).replace(srcRootEx, libFragment)
  return outPath
}

const dest = 'packages'

gulp.task('default', ['build', 'build-ts'])

const pkgPath = (cwd, sourcePath) => path.relative(path.join(cwd, 'packages'), sourcePath)

gulp.task('build', () => {
  const assetFilter = filter(['**/*.js'], {restore: true})

  return gulp
    .src(assets, srcOpts)
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(newer({map: mapToDest}))
    .pipe(assetFilter)
    .pipe(through.obj(logCompile))
    .pipe(babel())
    .pipe(assetFilter.restore)
    .pipe(
      through.obj((file, enc, callback) => {
        file._path = file.path
        file.path = mapToDest(file.path)
        callback(null, file)
      })
    )
    .pipe(gulp.dest(dest))
})

gulp.task('watch-js', () => {
  return gulp
    .src(scripts, srcOpts)
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(
      through.obj((file, enc, callback) => {
        file._path = file.path
        file.path = mapToDest(file.path)
        callback(null, file)
      })
    )
    .pipe(newer(dest))
    .pipe(through.obj(logCompile))
    .pipe(babel())
    .pipe(gulp.dest(dest))
})

// build-ts / watch-ts-build
;[
  {name: 'build-ts', params: {throwOnError: true}},
  {name: 'watch-ts-build', params: {throwOnError: false}}
].forEach(task => {
  gulp.task(task.name, () => {
    const getErrorHandler = () =>
      task.params.throwOnError
        ? through.obj((chunk, enc, cb) => cb(null, chunk))
        : plumber({errorHandler: err => gutil.log(err.stack)})

    const streams = tsProjects.map(project => {
      const src = project
        .src()
        .pipe(getErrorHandler())
        .pipe(sourcemaps.init())
        .pipe(project())

      return mergeStream(
        src.dts
          .pipe(getErrorHandler())
          .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'}))
          .pipe(gulp.dest(project.options.outDir)),

        src.js
          .pipe(getErrorHandler())
          .pipe(through.obj(logCompile))
          .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'}))
          .pipe(gulp.dest(project.options.outDir))
      )
    })

    return mergeStream(...streams)
  })
})

gulp.task('watch-ts', ['watch-ts-build'], () => gulp.watch(tsScripts, ['watch-ts-build']))

gulp.task('watch-assets', () => {
  return gulp
    .src(assets, srcOpts)
    .pipe(filter(['**/*.*', '!**/*.js']))
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(
      through.obj((file, enc, callback) => {
        file._path = file.path
        file.path = mapToDest(file.path)
        callback(null, file)
      })
    )
    .pipe(newer(dest))
    .pipe(
      through.obj((file, enc, callback) => {
        gutil.log('Copying  ', `'${chalk.green(pkgPath(file.cwd, file._path))}'...`)
        callback(null, file)
      })
    )
    .pipe(gulp.dest(dest))
})

gulp.task('watch', ['watch-js', 'watch-ts', 'watch-assets'], callback => {
  watch(scripts, {debounceDelay: 200}, () => {
    gulp.start('watch-js')
  })

  watch(assets, {debounceDelay: 200}, () => {
    gulp.start('watch-assets')
  })
})

const STUDIOS = [
  {name: 'test-studio', port: '3333'},
  {name: 'movies-studio', port: '3334'},
  {name: 'example-studio', port: '3335'},
  {name: 'blog-studio', port: '3336'},
  {name: 'ecommerce-studio', port: '3337'}
]

STUDIOS.forEach(studio => {
  gulp.task(studio.name, ['watch-js', 'watch-ts', 'watch-assets'], cb => {
    watch(scripts, {debounceDelay: 200}, () => {
      gulp.start('watch-js')
    })

    watch(assets, {debounceDelay: 200}, () => {
      gulp.start('watch-assets')
    })

    const projectPath = path.join(__dirname, 'packages', studio.name)
    const proc = childProcess.spawn(
      'sanity',
      ['start', '--host', '0.0.0.0', '--port', studio.port],
      {
        shell: isWindows,
        cwd: projectPath,
        env: getProjectEnv(projectPath)
      }
    )

    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
  })
})

gulp.task('storybook', ['watch-js', 'watch-ts', 'watch-assets'], () => {
  watch(scripts, {debounceDelay: 200}, () => {
    gulp.start('watch-js')
  })

  watch(assets, {debounceDelay: 200}, () => {
    gulp.start('watch-assets')
  })

  const projectPath = path.join(__dirname, 'packages', 'storybook')
  const proc = childProcess.spawn('npm', ['start'], {
    shell: isWindows,
    cwd: projectPath,
    env: getProjectEnv(projectPath)
  })

  proc.stdout.pipe(process.stdout)
  proc.stderr.pipe(process.stderr)
})
