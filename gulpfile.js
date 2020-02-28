/* eslint-disable import/no-commonjs, import/no-unassigned-import, max-nested-callbacks */

const {runStudio} = require('./scripts/utils/runStudio')

const {src, dest, watch, parallel, series} = require('gulp')
const del = require('del')
const path = require('path')
const changed = require('gulp-changed')
const ts = require('gulp-typescript')
const filter = require('gulp-filter')
const log = require('fancy-log')
const fs = require('fs')
const babel = require('gulp-babel')
const through = require('through2')

const {getPackagePaths} = require('./scripts/utils/getPackagePaths')

const DESTDIR = 'lib'

const IGNORE = /packages\/.*-studio/
const PACKAGE_PATHS = getPackagePaths().filter(pkgPath => !IGNORE.test(pkgPath))

function buildJavaScript(packageDir) {
  function builder() {
    return src(`src/**/*.{js,ts,tsx}`, {cwd: packageDir})
      .pipe(changed(DESTDIR, {cwd: packageDir}))
      .pipe(babel())
      .pipe(dest(DESTDIR, {cwd: packageDir}))
  }
  Object.defineProperty(builder, 'name', {
    value: `buildJS[${packageDir}]`
  })
  return builder
}

function copyAssets(packageDir) {
  function builder() {
    return src(`src/**/*`, {cwd: packageDir})
      .pipe(filter(['**/*.*', '!**/*.js', '!**/*.ts', '!**/*.tsx']))
      .pipe(changed(DESTDIR, {cwd: packageDir}))
      .pipe(dest(DESTDIR, {cwd: packageDir}))
  }
  Object.defineProperty(builder, 'name', {
    value: `copyAssets[${packageDir}]`
  })
  return builder
}

function watchAll(packageDir) {
  const t = () =>
    watch(
      [`src/**/*`],
      {cwd: packageDir},
      parallel(
        [buildJavaScript(packageDir), buildTypeScript(packageDir), copyAssets(packageDir)].filter(
          Boolean
        )
      )
    )
  Object.defineProperty(t, 'name', {
    value: `watch[${packageDir}]`
  })
  return t
}

function buildTypeScript(packageDir) {
  const tsConfigPath = path.join(packageDir, 'tsconfig.json')
  const isTS = fs.existsSync(tsConfigPath)
  if (!isTS) {
    return null
  }
  const project = ts.createProject(tsConfigPath)
  const task = () => {
    const compilation = project.src().pipe(project())
    return compilation.dts.pipe(dest(project.options.outDir))
  }

  Object.defineProperty(task, 'name', {
    value: `buildTS[${packageDir}]`
  })
  return task
}

const build = parallel(...PACKAGE_PATHS.map(buildJavaScript), ...PACKAGE_PATHS.map(copyAssets))

const watchOnly = parallel(...PACKAGE_PATHS.map(watchAll))

const buildTS = parallel(...PACKAGE_PATHS.map(buildTypeScript).filter(Boolean))

exports.buildTS = buildTS

exports['test-studio'] = series(
  build,
  parallel(watchOnly, function runStudio_() {
    log('Starting studio…')
    runStudio(path.join(__dirname, 'packages', 'test-studio'), 3333).pipe(
      through((data, enc, cb) => {
        log(data.toString())
        cb()
      })
    )
  })
)
exports.clean = () => del(PACKAGE_PATHS.map(p => path.join(p, 'lib')))
