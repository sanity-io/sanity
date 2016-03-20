import path from 'path'
import fsp from 'fs-promise'
import promiseProps from 'promise-props-recursive'
import getBaseLoader from './getBaseLoader'
import rewriteCss from './rewriteCss'

const getPath = item => item.srcPath || item.path

function sanityStyleLoader(options, callback) {
  const {roles, query} = options
  const roleName = `style:${query.style}`

  // Add plugin manifests as dependencies
  roles.plugins.forEach(plugin => {
    this.addDependency(path.join(plugin.path, 'sanity.json'))
  })

  // Do we have this role defined?
  const fulfillers = roles.fulfilled[roleName]
  if (!fulfillers || fulfillers.length === 0) {
    callback(new Error(
      `No plugins have fulfilled the "${roleName}" role`
    ))
    return
  }

  // Add CSS files as dependencies
  fulfillers.forEach(fulfiller => {
    this.addDependency(getPath(fulfiller))
  })

  // Build CSS header
  const css = `/**\n * Role: "${roleName}"\n */\n\n`

  // Load all CSS files
  Promise.all(fulfillers.map(
    fulfiller => promiseProps({
      css: fsp.readFile(getPath(fulfiller), {encoding: 'utf8'}),
      path: getPath(fulfiller),
      plugin: fulfiller.plugin,
      relativeTo: __dirname,
      role: roleName
    }).then(rewriteCss)
  )).then(files => {
    // Reverse order here, because we want items sorted in the
    // same order as they're defined in the Sanity manifest
    callback(null, files.reduceRight(reduceCss, css))
  }).catch(callback)
}

function reduceCss(currentCss, fulfiller) {
  let css = `/* ${fulfiller.plugin} */\n`
  css += fulfiller.css

  return `${currentCss}${css}`
}

module.exports = getBaseLoader(sanityStyleLoader)
