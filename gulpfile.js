/* eslint-disable import/no-commonjs, import/no-unassigned-import, max-nested-callbacks */

const {src, dest, watch, parallel, series} = require('gulp')
const del = require('del')
const path = require('path')
const changed = require('gulp-changed')
const ts = require('gulp-typescript')
const filter = require('gulp-filter')
const log = require('fancy-log')
const chalk = require('chalk')
const fs = require('fs')
const babel = require('gulp-babel')
const through = require('through2')

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
  /packages\/.*-studio/
]

const PACKAGE_PATHS = getPackagePaths().filter(pkgPath =>
  IGNORED_PACKAGES.every(pattern =>
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
  _unknown: {title: 'Unknown', color: chalk.white}
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
          transformPath: orgPath => orgPath.replace(/\.tsx?$/, '.js')
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

function buildTypeScript(packageDir) {
  const tsConfigPath = path.join(packageDir, 'tsconfig.json')
  const isTSProject = fs.existsSync(tsConfigPath)
  if (!isTSProject) {
    return withDisplayName(compileTaskName('dts', packageDir, 'noop'), cb => cb())
  }
  const project = ts.createProject(tsConfigPath)
  return withDisplayName(compileTaskName('dts', packageDir), () => {
    const compilation = project.src().pipe(project())
    return compilation.dts
      .pipe(
        changed(DEST_DIR, {
          cwd: packageDir
        })
      )
      .pipe(dest(project.options.outDir))
  })
}

function buildPackage(packageDir) {
  return parallel(buildJavaScript(packageDir), buildTypeScript(packageDir), copyAssets(packageDir))
}

function watchPackage(packageDir) {
  return withDisplayName(compileTaskName('watch', packageDir), () =>
    watch([`${SRC_DIR}/**/*`], {cwd: packageDir}, buildPackage(packageDir))
  )
}

const buildAll = parallel(PACKAGE_PATHS.map(buildPackage))
const watchAll = parallel(PACKAGE_PATHS.map(watchPackage))

function studioTask(name, port) {
  return series(
    buildAll,
    parallel(watchAll, function runStudio() {
      log(`Starting ${name}…`)
      runSanityStart(path.join(__dirname, 'packages', name), port).pipe(
        through((data, enc, cb) => {
          log(data.toString())
          cb()
        })
      )
    })
  )
}

;[
  ['test-studio', '3333'],
  ['movies-studio', '3334'],
  ['example-studio', '3335'],
  ['blog-studio', '3336'],
  ['ecommerce-studio', '3337'],
  ['clean-studio', '3338'],
  ['storybook', '9002']
].forEach(([name, port]) => {
  exports[name] = studioTask(name, port)
})

exports.build = buildAll
exports.clean = () => del(PACKAGE_PATHS.map(pth => path.join(pth, DEST_DIR)))
