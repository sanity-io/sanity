/* eslint-disable import/no-commonjs, import/no-unassigned-import, max-nested-callbacks */
// Note: Node 8 compat, please!
require('hard-rejection/register')

const fs = require('fs')
const childProcess = require('child_process')
const path = require('path')
const {series, parallel, src, dest, watch} = require('gulp')
const newer = require('gulp-newer')
const babel = require('gulp-babel')
const gutil = require('gulp-util')
const changed = require('gulp-changed')
const filter = require('gulp-filter')
const plumber = require('gulp-plumber')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')
const through = require('through2')
const chalk = require('chalk')
const globby = require('globby')
const mergeStream = require('merge-stream')
const {promisify} = require('util')

const stat = promisify(fs.stat)
const isWindows = /^win/.test(process.platform)

const compareModified = async (stream, sourceFile, targetPath) => {
  const targetStat = await stat(targetPath)

  if (sourceFile.stat && Math.floor(sourceFile.stat.mtimeMs) > Math.floor(targetStat.mtimeMs)) {
    stream.push(sourceFile)
  }
}

const tsPaths = globby.sync(['./packages/@sanity/*/tsconfig.json'])
const tsProjects = tsPaths.map(conf => ts.createProject(conf))
const scripts = [
  './packages/@sanity/*/src/**/*.{js,ts,tsx}',
  './packages/sanity-plugin-*/src/**/*.{js,ts,tsx}',
  './packages/groq/src/**/*.{js,ts,tsx}'
]

const assets = [
  './packages/@sanity/*/src/**/*',
  './packages/sanity-plugin-*/src/**/*',
  './packages/groq/src/**/*'
]

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
  srcRootEx = /(groq|sanity-plugin-[^\\]+)\\src\\/
  libFragment = '$1\\lib\\'
} else {
  srcEx = new RegExp('(@sanity/[^/]+)/src/')
  srcRootEx = /(groq|sanity-plugin-[^/]+)\/src\//
  libFragment = '$1/lib/'
}

const pkgPath = (cwd, sourcePath) => path.relative(path.join(cwd, 'packages'), sourcePath)

const log = prefix =>
  through.obj((file, enc, cb) => {
    if (process.env.VERBOSE) {
      gutil.log(prefix, `'${chalk.green(pkgPath(file.cwd, file._path || file.path))}'...`)
    }
    cb(null, file)
  })

const logCompile = from => log(`[${from}] Compiling `)

const mapToDefinitionPath = baseDir => {
  const packagesRoot = path.join(__dirname, 'packages')
  return orgPath => {
    return path
      .join(baseDir, 'lib', orgPath.replace(packagesRoot, ''))
      .replace(/\.d\.d\.tsx?$/, '.d.ts')
  }
}

const mapToDest = orgPath => {
  const outPath = orgPath
    .replace(srcEx, libFragment)
    .replace(srcRootEx, libFragment)
    .replace(/\.tsx?$/, '.js')

  return outPath
}

const packagesPath = 'packages'
const getLogErrorHandler = () => plumber({errorHandler: err => gutil.log(err.stack)})
const watchJavaScript = series(buildJavaScript, function watchJS() {
  watch(scripts, watchJavaScriptRebuild)
})

const watchAssets = series(buildAssets, function watchAsset() {
  watch(assets, buildAssets)
})

const watchTypeScript = series(buildTypeScript, function watchTS() {
  tsProjects.forEach(project => {
    const builder = function() {
      return rebuildTypeScriptProject(project)
    }

    Object.defineProperty(builder, 'name', {
      value: `buildTypeScript[${path.basename(project.projectDirectory)}]`
    })

    watch(`${project.projectDirectory}/src/**/*.{ts,tsx}`, builder)
  })
})

exports.default = parallel(buildJavaScript, buildTypeScript)
exports.build = parallel(buildJavaScript, buildTypeScript)
exports.watchTypeScript = watchTypeScript
exports.watch = parallel(watchJavaScript, watchTypeScript, watchAssets)

function buildJavaScript() {
  const assetFilter = filter(['**/*.{js,ts,tsx}'], {restore: true})
  return src(assets, srcOpts)
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(assetFilter)
    .pipe(
      changed(packagesPath, {
        transformPath: mapToDest,
        hasChanged: compareModified
      })
    )
    .pipe(logCompile(chalk.yellow('JS')))
    .pipe(babel())
    .pipe(assetFilter.restore)
    .pipe(
      through.obj((file, enc, callback) => {
        file._path = file.path
        file.path = mapToDest(file.path)
        callback(null, file)
      })
    )
    .pipe(dest(packagesPath))
}

function watchJavaScriptRebuild() {
  return src(scripts, srcOpts)
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(
      through.obj((file, enc, callback) => {
        file._path = file.path
        file.path = mapToDest(file.path)
        callback(null, file)
      })
    )
    .pipe(newer(packagesPath))
    .pipe(logCompile(chalk.yellow('JS')))
    .pipe(babel())
    .pipe(dest(packagesPath))
}

function rebuildTypeScriptProject(project) {
  return project
    .src()
    .pipe(logCompile(chalk.blue('TS')))
    .pipe(getLogErrorHandler())
    .pipe(project())
    .js.pipe(getLogErrorHandler())
    .pipe(dest(project.options.outDir))
}

function buildTypeScript() {
  return mergeStream(
    ...tsProjects.map(project => {
      const compilation = project
        .src()
        .pipe(
          changed(packagesPath, {
            transformPath: mapToDefinitionPath(project.projectDirectory),
            hasChanged: compareModified,
            extension: '.d.ts'
          })
        )
        .pipe(through.obj(chalk.blueBright('D.TS')))
        .pipe(project())
      return compilation.dts
        .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'}))
        .pipe(dest(project.options.outDir))
    })
  )
}

function buildAssets() {
  return src(assets, srcOpts)
    .pipe(filter(['**/*.*', '!**/*.js', '!**/*.ts', '!**/*.tsx']))
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(
      through.obj((file, enc, callback) => {
        file._path = file.path
        file.path = mapToDest(file.path)
        callback(null, file)
      })
    )
    .pipe(newer(packagesPath))
    .pipe(log('Copying'))
    .pipe(dest(packagesPath))
}

const STUDIOS = [
  {name: 'test-studio', port: '3335'},
  {name: 'movies-studio', port: '3334'},
  {name: 'example-studio', port: '3335'},
  {name: 'blog-studio', port: '3336'},
  {name: 'ecommerce-studio', port: '3337'},
  {name: 'clean-studio', port: '3338'}
]

STUDIOS.forEach(studio => {
  exports[studio.name] = series(
    parallel(buildJavaScript, buildTypeScript, buildAssets),
    parallel(exports.watch, function runStudio(cb) {
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
  )
})

exports.storybook = series(
  parallel(buildJavaScript, buildTypeScript, buildAssets),
  parallel(exports.watch, function runStorybook(cb) {
    const projectPath = path.join(__dirname, 'packages', 'storybook')
    const proc = childProcess.spawn('npm', ['start'], {
      shell: isWindows,
      cwd: projectPath,
      env: getProjectEnv(projectPath)
    })

    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
  })
)
