/* eslint-disable @typescript-eslint/no-var-requires, import/no-unassigned-import, max-nested-callbacks */

const path = require('path')
const {src, dest, watch, parallel, series} = require('gulp')
const del = require('del')
const changed = require('gulp-changed')
const filter = require('gulp-filter')
const chalk = require('chalk')
const babel = require('gulp-babel')
const log = require('fancy-log')
const through = require('through2')
const {runTsc} = require('./scripts/runTsc')

const {getPackagePaths} = require('./scripts/utils/getPackagePaths')

const SRC_DIR = 'src'
const LEGACY_DEST_DIR = 'lib'
const DEST_DIR = 'dist'

// Regexes/names of packages that doesn't follow the src/lib convention
// or packages that does their own build (e.g. studios)
const IGNORED_PACKAGES = [
  'dev/workshop',
  /dev\/.*/,
  /examples\/.*-studio/,
  'packages/@sanity/date-input',
  'packages/@sanity/eventsource',
  'packages/@sanity/plugin-loader',
  'packages/create-sanity',
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

function buildJavaScript(packageDir, destDir) {
  return withDisplayName(compileTaskName('babel', packageDir, 'cjs'), () =>
    src([`${SRC_DIR}/**/*.{js,jsx,ts,tsx}`, '!**/*.{test,spec}.{js,jsx,ts,tsx}'], {cwd: packageDir})
      .pipe(
        changed(destDir, {
          cwd: packageDir,
          transformPath: (orgPath) => orgPath.replace(/\.(t|j)sx?$/, '.js'),
        })
      )
      .pipe(babel())
      .pipe(dest(destDir, {cwd: packageDir}))
  )
}

function copyAssets(packageDir, destDir) {
  return withDisplayName(compileTaskName('assets', packageDir), () =>
    src(`${SRC_DIR}/**/*`, {cwd: packageDir})
      .pipe(filter(['**/*.*', '!**/*.js', '!**/*.jsx', '!**/*.ts', '!**/*.tsx']))
      .pipe(changed(destDir, {cwd: packageDir}))
      .pipe(dest(destDir, {cwd: packageDir}))
  )
}

function buildPackage(packageDir) {
  return parallel(
    buildJavaScript(packageDir, LEGACY_DEST_DIR),
    copyAssets(packageDir, LEGACY_DEST_DIR)
  )
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

function matchPackages(names) {
  const matchPkgs = names.map((n) => `packages/${n}`)
  return (pkg) => matchPkgs.includes(pkg)
}

const CLI_PKGS = [
  '@sanity/cli',
  '@sanity/core',
  '@sanity/export',
  '@sanity/import',
  '@sanity/mutator',
  '@sanity/resolver',
  '@sanity/server',
  '@sanity/util',
  '@sanity/webpack-loader',
]

exports.js = buildJSAndAssets
exports['build:cli'] = parallel(PACKAGE_PATHS.filter(matchPackages(CLI_PKGS)).map(buildPackage))
exports.watchTS = series(buildTS, watchTS)
exports.watchJS = series(buildJSAndAssets, watchJSAndAssets)
exports.build = series(buildJSAndAssets, buildTS)
exports.watch = series(buildJSAndAssets, parallel(watchJSAndAssets, watchTS))
exports.clean = () =>
  del(PACKAGE_PATHS.flatMap((pth) => [path.join(pth, LEGACY_DEST_DIR), path.join(pth, DEST_DIR)]))
