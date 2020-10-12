'use strict'

var path = require('path')

var fse = require('fs-extra')

var promiseProps = require('promise-props-recursive')

var generateHelpUrl = require('@sanity/generate-help-url')

var resolveParts = require('@sanity/resolver').resolveParts

var includes = (arr, val) => arr.indexOf(val) !== -1

function sanityCheck(options) {
  return resolveParts({
    basePath: options.dir,
    useCompiledPaths: options.productionMode,
  }).then((parts) => checkImplementations(parts, options))
}

function checkImplementations(result, options) {
  var implementations = result.implementations

  if (!implementations) {
    return Promise.resolve('No implementations found, nothing to check')
  }

  var fulfillers = Object.keys(implementations).reduce((impls, partName) => {
    return impls.concat(
      implementations[partName].map((impl) => ({
        partName: partName,
        plugin: impl.plugin,
        path: impl.path,
        dirName: path.dirname(impl.path),
        fileName: path.basename(impl.path),
      }))
    )
  }, [])
  return getFolderContents(fulfillers.map((impl) => impl.dirName))
    .then((folders) => verifyImplementationsExist(fulfillers, folders))
    .then((results) => throwOnErrors(results, options))
}

function throwOnErrors(results, options) {
  var errors = results
    .filter((result) => result instanceof Error)
    .map((err) => ' * '.concat(err.message))

  if (errors.length > 0) {
    if (options.productionMode) {
      errors.push(getProductionHint())
    }

    var err = new Error(errors.join('\n\n'))
    err.messages = errors
    err.sanityCheck = true
    throw err
  }
}

function getFolderContents(dirs) {
  return promiseProps(
    dirs.reduce((folders, dir) => {
      if (!folders[dir]) {
        folders[dir] = fse.readdir(dir).catch(() => [])
      }

      return folders
    }, {})
  )
}

function verifyImplementationsExist(implementations, folderContents) {
  return Promise.all(
    implementations.map((impl) => verifyImplementationExists(impl, folderContents[impl.dirName]))
  )
}

function verifyImplementationExists(impl, parentDirContent) {
  // Case-sensitive check
  var containsFile = includes(parentDirContent, impl.fileName)
  var containsJsFile = includes(parentDirContent, ''.concat(impl.fileName, '.js'))

  if (containsFile) {
    return isFileOrDirectoryWithIndex(impl)
  } else if (containsJsFile) {
    return true
  } // Case-insensitive check

  var targetFile = impl.fileName.toLowerCase()
  var targetJsFile = ''.concat(targetFile, '.js')
  var found = parentDirContent.find(
    (file) => file.toLowerCase() === targetFile || file.toLowerCase() === targetJsFile
  )

  if (found) {
    return new Error(
      'Part "'
        .concat(impl.partName, '" was attempted to be implemented by "')
        .concat(impl.path, '",') +
        'but the file is actually located at "'.concat(path.join(impl.dirName, found), '" -') +
        ' Sanity uses case-sensitive file names.'
    )
  } // Directory/index.js check

  return isFileOrDirectoryWithIndex(impl)
}

function checkImplementationMsg(impl) {
  var location =
    impl.plugin === '(project root)' ? 'Check "sanity.json"' : 'Check "'.concat(impl.plugin, '"')
  return ''.concat(location, ' and keep in mind that paths in Sanity are case-sensitive.')
}

function isFileOrDirectoryWithIndex(impl) {
  return fse
    .stat(impl.path)
    .then((stats) => {
      return stats.isDirectory() ? directoryHasIndex(impl) : true
    })
    .catch(
      () =>
        new Error(
          'Part "'
            .concat(impl.partName, '" was attempted to be implemented by "')
            .concat(impl.path, '", ') +
            'which does not seem to exist. '.concat(checkImplementationMsg(impl))
        )
    )
}

function directoryHasIndex(impl) {
  return fse.readdir(impl.path).then((dirContent) => {
    return includes(dirContent, 'index.js')
      ? true
      : new Error(
          'Part "'
            .concat(impl.partName, '" was attempted to be implemented by "')
            .concat(impl.path, '", ') +
            'which is a directory without an "index.js". Please point to a filename.'
        )
  })
}
/* eslint-disable prefer-template */

function getProductionHint() {
  return (
    '[NOTE]: sanity-check is running in production mode - ' +
    'perhaps you have defined a `compiled` path in `sanity.json`? ' +
    'This tells Sanity to look for the files in a different location ' +
    'when running in production mode. When publishing plugins to npm ' +
    'you should make sure to publish precompiled files. See ' +
    generateHelpUrl('source-vs-compiled-paths')
  )
}
/* eslint-enable prefer-template */

module.exports = sanityCheck
