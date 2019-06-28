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
const backstop = require('backstopjs')
const waitPort = require('wait-port')
const kill = require('kill-port')
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
  './packages/@sanity/*/src/**/*.js',
  './packages/sanity-plugin-*/src/**/*.js',
  './packages/groq/src/**/*.js'
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

const logCompile = from => (file, enc, cb) => {
  gutil.log(`[${from}] Compiling`, `'${chalk.cyan(file._path || file.path)}'...`)
  cb(null, file)
}

const mapToDest = orgPath => {
  const outPath = orgPath.replace(srcEx, libFragment).replace(srcRootEx, libFragment)
  return outPath
}

const packagesPath = 'packages'
const pkgPath = (cwd, sourcePath) => path.relative(path.join(cwd, 'packages'), sourcePath)
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

    watch(`${project.projectDirectory}/src/**/*.ts`, builder)
  })
})

exports.default = parallel(buildJavaScript, buildTypeScript)
exports.build = parallel(buildJavaScript, buildTypeScript)
exports.watchTypeScript = watchTypeScript
exports.watch = parallel(watchJavaScript, watchTypeScript, watchAssets)

function buildJavaScript() {
  const assetFilter = filter(['**/*.js'], {restore: true})
  return src(assets, srcOpts)
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(assetFilter)
    .pipe(
      changed(packagesPath, {
        transformPath: inp => mapToDest(inp),
        hasChanged: compareModified
      })
    )
    .pipe(through.obj(logCompile('JS')))
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
    .pipe(through.obj(logCompile('JS')))
    .pipe(babel())
    .pipe(dest(packagesPath))
}

function rebuildTypeScriptProject(project) {
  return project
    .src()
    .pipe(through.obj(logCompile('TS')))
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
        .pipe(through.obj(logCompile('TS')))
        .pipe(project())

      return mergeStream(
        compilation.dts
          .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'}))
          .pipe(dest(project.options.outDir)),

        compilation.js
          .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'}))
          .pipe(dest(project.options.outDir))
      )
    })
  )
}

function buildAssets() {
  return src(assets, srcOpts)
    .pipe(filter(['**/*.*', '!**/*.js', '!**/*.ts']))
    .pipe(plumber({errorHandler: err => gutil.log(err.stack)}))
    .pipe(
      through.obj((file, enc, callback) => {
        file._path = file.path
        file.path = mapToDest(file.path)
        callback(null, file)
      })
    )
    .pipe(newer(packagesPath))
    .pipe(
      through.obj((file, enc, callback) => {
        gutil.log('Copying  ', `'${chalk.green(pkgPath(file.cwd, file._path))}'...`)
        callback(null, file)
      })
    )
    .pipe(dest(packagesPath))
}

const STUDIOS = [
  {name: 'test-studio', port: '3333'},
  {name: 'movies-studio', port: '3334'},
  {name: 'example-studio', port: '3335'},
  {name: 'blog-studio', port: '3336'},
  {name: 'ecommerce-studio', port: '3337'},
  {name: 'clean-studio', port: '3338'},
  {name: 'backstop-test-studio', port: '5000'}
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

exports.backstop = function(cb) {
  childProcess.exec('docker -v', err => {
    if (err) {
      throw new gutil.PluginError({
        plugin: 'backstop',
        message: gutil.colors.red('Please install Docker on your computer. https://www.docker.com/')
      })
    }
  })

  const params = {
    host: 'localhost',
    port: 5000,
    timeout: 100 * 60 * 10
  }

  parallel(exports['backstop-test-studio'], async () => {
    let open
    try {
      open = await waitPort(params)
    } catch (err) {
      kill(params.port)
      throw new gutil.PluginError({
        plugin: 'backstop',
        message: `An unknown error occured while waiting for the port: ${err}`
      })
    }

    if (!open) {
      kill(params.port)
      throw new gutil.PluginError({
        plugin: 'backstop',
        message: 'The backstop-studio did not start'
      })
    }

    try {
      await backstop('test', {
        docker: true,
        config: './test/backstop/backstop.js'
      })

      await kill(params.port)
      gutil.log(gutil.colors.green('Backstop test success'))
      // eslint-disable-next-line no-process-exit
      process.exit(0)
    } catch (err) {
      kill(params.port)
      throw new gutil.PluginError({
        plugin: 'backstop',
        message: 'Tests failed'
      })
    }

    cb()
  })()
}

exports['backstop:approve'] = cb => {
  backstop('approve', {
    docker: true,
    config: './test/backstop/backstop.js'
  })
}

exports['backstop:reference'] = async cb => {
  try {
    await backstop('reference', {
      docker: true,
      config: './test/backstop/backstop.js'
    })

    gutil.log(gutil.colors.green('References created'))
  } catch (err) {
    throw new gutil.PluginError({
      plugin: 'backstop',
      message: 'Making references failed'
    })
  }
}
