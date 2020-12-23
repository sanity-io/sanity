/* eslint-disable @typescript-eslint/no-var-requires, import/no-unassigned-import, max-nested-callbacks */

const path = require('path')
const {src, dest, watch, parallel, series} = require('gulp')
const del = require('del')
const changed = require('gulp-changed')
const filter = require('gulp-filter')
const chalk = require('chalk')
const babel = require('gulp-babel')
const {runTsc} = require('./scripts/runTsc')
const log = require('fancy-log')
const through = require('through2')

const {getPackagePaths} = require('./scripts/utils/getPackagePaths')

const SRC_DIR = 'src'
const DEST_DIR = 'lib'

// Regexes/names of packages that doesn't follow the src/lib convention
// or packages that does their own build (e.g. studios)
const IGNORED_PACKAGES = [
  'examples/storybook',
  /examples\/.*-studio/,
  'packages/@sanity/date-input',
  'packages/@sanity/eventsource',
  'packages/@sanity/generate-help-url',
  'packages/@sanity/plugin-loader',
  'packages/create-sanity',
  'packages/eslint-config-sanity',
  'packages/sanity',
]

const PACKAGE_PATHS = getPackagePaths().filter((pkgPath) =>
  IGNORED_PACKAGES.every((pattern) =>
    typeof pattern === 'string' ? pattern !== pkgPath : !pattern.test(pkgPath)
  )
)

const withDisplayName = (name, fn) => {
  fn.displayName = name
  return fn
}

const TASK_INFO = {
  babel: {title: 'Babel', color: chalk.yellowBright},
  assets: {title: 'Assets (copy)', color: chalk.greenBright},
  watch: {title: 'Watch', color: chalk.cyanBright},
  _unknown: {title: 'Unknown', color: chalk.white},
}

const compileTaskName = (taskType, packagePath, extra = '') => {
  const info = TASK_INFO[taskType] || TASK_INFO._unknown
  return `${info.color(info.title)} → ${path.relative('packages', packagePath)}${
    extra ? ` (${chalk.grey(extra)})` : ''
  }`
}

function buildJavaScript(packageDir) {
  return withDisplayName(compileTaskName('babel', packageDir), () =>
    src(`${SRC_DIR}/**/*.{js,ts,tsx}`, {cwd: packageDir})
      .pipe(
        changed(DEST_DIR, {
          cwd: packageDir,
          transformPath: (orgPath) => orgPath.replace(/\.tsx?$/, '.js'),
        })
      )
      .pipe(babel())
      .pipe(dest(DEST_DIR, {cwd: packageDir}))
  )
}

function copyAssets(packageDir) {
  return withDisplayName(compileTaskName('assets', packageDir), () =>
    src(`${SRC_DIR}/**/*`, {cwd: packageDir})
      .pipe(filter(['**/*.*', '!**/*.js', '!**/*.ts', '!**/*.tsx']))
      .pipe(changed(DEST_DIR, {cwd: packageDir}))
      .pipe(dest(DEST_DIR, {cwd: packageDir}))
  )
}

function buildPackage(packageDir) {
  return parallel(buildJavaScript(packageDir), copyAssets(packageDir))
}

function watchPackage(name, packageDir, task) {
  return withDisplayName(name, () => watch([`${SRC_DIR}/**/*`], {cwd: packageDir}, task))
}

const watchTS = function watchTS() {
  return runTsc(path.join(__dirname), true).pipe(
    through((data, enc, cb) => {
      log(data.toString())
      cb()
    })
  )
}
const buildTS = function buildTS() {
  return runTsc(path.join(__dirname)).pipe(
    through((data, enc, cb) => {
      log(data.toString())
      cb()
    })
  )
}

const buildJSAndAssets = parallel(PACKAGE_PATHS.map(buildPackage))
const watchJSAndAssets = parallel(
  PACKAGE_PATHS.map((packageDir) =>
    watchPackage(
      compileTaskName('watch', packageDir, 'JS/Assets'),
      packageDir,
      buildPackage(packageDir)
    )
  )
)

exports.ts = buildTS
exports.watchTS = series(buildTS, watchTS)
exports.build = series(buildJSAndAssets, buildTS)
exports.watch = series(buildJSAndAssets, parallel(watchJSAndAssets, watchTS))
exports.clean = () => del(PACKAGE_PATHS.map((pth) => path.join(pth, DEST_DIR)))
