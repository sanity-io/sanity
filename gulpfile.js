/* eslint-disable @typescript-eslint/no-var-requires, import/no-unassigned-import, max-nested-callbacks */

const fs = require('fs')
const path = require('path')
const {src, dest, watch, parallel, series} = require('gulp')
const del = require('del')
const changed = require('gulp-changed')
const ts = require('gulp-typescript')
const filter = require('gulp-filter')
const {flatten} = require('lodash')
const log = require('fancy-log')
const notify = require('gulp-notify')
const plumber = require('gulp-plumber')
const chalk = require('chalk')
const babel = require('gulp-babel')
const through = require('through2')
const {getPackagesOrderedByTopology} = require('./scripts/utils/getPackagesOrderedByTopology')

const {getPackagePaths} = require('./scripts/utils/getPackagePaths')
const {runSanityStart} = require('./scripts/utils/runSanityStart')

const SRC_DIR = 'src'
const DEST_DIR = 'lib'

// Regexes/names of packages that doesn't follow the src/lib convention
// or packages that does their own build (e.g. studios)
const IGNORED_PACKAGES = [
  'packages/@sanity/generate-help-url',
  'packages/@sanity/plugin-loader',
  'packages/@sanity/eventsource',
  'packages/@sanity/date-input',
  'packages/@sanity/uuid',
  'packages/eslint-config-sanity',
  'packages/create-sanity',
  'packages/storybook',
  'packages/sanity',
  /packages\/.*-studio/,
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
  dts: {title: 'TypeScript (d.ts)', color: chalk.blueBright},
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

function notifyErrors(title) {
  return plumber({
    errorHandler: notify.onError({
      title,
      error: '<%= error.message %>',
      // Sound can be one of these: Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink.
      // See https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
      sound: process.env.TS_ERROR_SOUND === 'off' ? false : process.env.TS_ERROR_SOUND || 'Purr',
    }),
  })
}

function buildTypeScript(packageDir) {
  return withDisplayName(compileTaskName('dts', packageDir), () => {
    const project = ts.createProject(path.join(packageDir, 'tsconfig.json'))
    return project
      .src()
      .pipe(notifyErrors(`Error in ${path.relative('packages', packageDir)}`))
      .pipe(project())
      .dts.pipe(dest(project.options.outDir))
  })
}

function buildPackage(packageDir) {
  return parallel(buildJavaScript(packageDir), copyAssets(packageDir))
}

function watchPackage(name, packageDir, task) {
  return withDisplayName(name, () => watch([`${SRC_DIR}/**/*`], {cwd: packageDir}, task))
}

const isTSProject = (packageDir) => {
  const tsConfigPath = path.join(packageDir, 'tsconfig.json')
  return fs.existsSync(tsConfigPath)
}

// We the list of packages ordered by topology to make sure we compile in the correct order
const ORDERED_PACKAGES = getPackagesOrderedByTopology().map((pkgName) =>
  path.resolve(__dirname, `packages/${pkgName}`)
)

const TS_PROJECTS = ORDERED_PACKAGES.filter(isTSProject)

const buildTS = series(TS_PROJECTS.map(buildTypeScript))

const watchTS = parallel(
  flatten(TS_PROJECTS).map((packageDir) =>
    watchPackage(
      compileTaskName('watch', packageDir, 'TS'),
      packageDir,
      buildTypeScript(packageDir)
    )
  )
)

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

function studioTask(name, port) {
  return series(
    buildJSAndAssets,
    parallel(
      watchJSAndAssets,
      function runStudio() {
        log(`Starting ${name}…`)
        runSanityStart(path.join(__dirname, 'packages', name), port).pipe(
          through((data, enc, cb) => {
            log(data.toString())
            cb()
          })
        )
      },
      series(buildTS, watchTS)
    )
  )
}

;[
  ['test-studio', '3333'],
  ['movies-studio', '3334'],
  ['example-studio', '3335'],
  ['blog-studio', '3336'],
  ['ecommerce-studio', '3337'],
  ['clean-studio', '3338'],
  ['design-studio', '4000'],
  ['storybook', '9002'],
].forEach(([name, port]) => {
  exports[name] = studioTask(name, port)
})

exports.build = parallel(buildJSAndAssets, buildTS)
exports.watch = series(parallel(buildJSAndAssets, buildTS), parallel(watchJSAndAssets, watchTS))
exports.clean = () => del(PACKAGE_PATHS.map((pth) => path.join(pth, DEST_DIR)))
