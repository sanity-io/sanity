/* eslint-disable @typescript-eslint/no-var-requires, import/no-unassigned-import, max-nested-callbacks */

const path = require('path')
const {src, dest, watch, parallel, series} = require('gulp')
const del = require('del')
const changed = require('gulp-changed')
const filter = require('gulp-filter')
const chalk = require('chalk')
const esbuild = require('gulp-esbuild')
const babel = require('gulp-babel')
const {runTsc} = require('./scripts/runTsc')
const log = require('fancy-log')
const through = require('through2')

const {getPackagePaths} = require('./scripts/utils/getPackagePaths')

const SRC_DIR = 'src'
const LEGACY_DEST_DIR = 'lib'
const DEST_DIR = 'dist'

// Regexes/names of packages that doesn't follow the src/lib convention
// or packages that does their own build (e.g. studios)
const IGNORED_PACKAGES = [
  'examples/depcheck-test',
  'examples/storybook',
  /examples\/.*-studio/,
  'packages/@sanity/components',
  'packages/@sanity/date-input',
  'packages/@sanity/eventsource',
  'packages/@sanity/generate-help-url',
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
  esbuild: {title: 'Esbuild', color: chalk.yellowBright},
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

function buildWithBabel(packageDir, destDir) {
  return withDisplayName(compileTaskName('babel', packageDir), () =>
    src(`${SRC_DIR}/**/*.{js,ts,tsx}`, {cwd: packageDir})
      .pipe(
        changed(destDir, {
          cwd: packageDir,
          transformPath: (orgPath) => orgPath.replace(/\.tsx?$/, '.js'),
        })
      )
      .pipe(babel())
      .pipe(dest(destDir, {cwd: packageDir}))
  )
}

function buildWithEsbuild(packageDir, destDir) {
  return withDisplayName(compileTaskName('esbuild', packageDir), () =>
    src(`${SRC_DIR}/**/*.{js,ts,tsx}`, {cwd: packageDir})
      .pipe(
        changed(destDir, {
          cwd: packageDir,
          transformPath: (orgPath) => orgPath.replace(/\.tsx?$/, '.js'),
        })
      )
      .pipe(
        esbuild({
          format: 'cjs',
          target: ['es2020', 'chrome80', 'firefox80', 'safari11', 'edge18', 'node12'],
          loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
            '.js': 'jsx',
          },
        })
      )
      .pipe(dest(destDir, {cwd: packageDir}))
  )
}

function copyAssets(packageDir, destDir) {
  return withDisplayName(compileTaskName('assets', packageDir), () =>
    src(`${SRC_DIR}/**/*`, {cwd: packageDir})
      .pipe(filter(['**/*.*', '!**/*.js', '!**/*.ts', '!**/*.tsx']))
      .pipe(changed(destDir, {cwd: packageDir}))
      .pipe(dest(destDir, {cwd: packageDir}))
  )
}

function buildPackageWithBabel(packageDir) {
  return parallel(
    buildWithBabel(packageDir, LEGACY_DEST_DIR),
    copyAssets(packageDir, LEGACY_DEST_DIR)
  )
}
function buildPackageWithEsbuild(packageDir) {
  return parallel(
    buildWithEsbuild(packageDir, LEGACY_DEST_DIR),
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

const watchJSAndAssets = parallel(
  PACKAGE_PATHS.map((packageDir) =>
    watchPackage(
      compileTaskName('watch', packageDir, 'JS/Assets'),
      packageDir,
      buildPackageWithBabel(packageDir, LEGACY_DEST_DIR)
    )
  )
)

const buildAllWithEsbuild = parallel(PACKAGE_PATHS.map(buildPackageWithEsbuild))
const buildAllWithBabel = parallel(PACKAGE_PATHS.map(buildPackageWithBabel))

exports.esbuild = buildAllWithEsbuild
exports.babel = buildAllWithBabel
exports.ts = buildTS
exports.watchTS = series(buildTS, watchTS)
exports.clean = () =>
  del(PACKAGE_PATHS.flatMap((pth) => [path.join(pth, LEGACY_DEST_DIR), path.join(pth, DEST_DIR)]))
exports.build = series(buildAllWithBabel, buildTS)
exports.watch = series(buildAllWithBabel, parallel(watchJSAndAssets, watchTS))
exports.clean = () => del(PACKAGE_PATHS.map((pth) => path.join(pth, DEST_DIR)))
