'use strict'

const path = require('path')
const fsp = require('fs-promise')
const loaderUtils = require('loader-utils')
const resolver = require('@sanity/resolver')
const promiseProps = require('promise-props-recursive')
const rewriteCss = require('./rewriteCss')

const getPath = item => item.srcPath || item.path

function sanityStyleLoader(input) {
  const callback = this.async()
  const query = loaderUtils.parseQuery(this.query)

  if (!query.basePath) {
    callback(new Error('`basePath` property must be passed to style loader'))
    return
  }

  if (!query.style) {
    callback(new Error('`style` property must be passed to style loader'))
    return
  }

  this.addDependency(path.join(query.basePath, 'sanity.json'))

  resolver
    .resolveRoles({basePath: query.basePath})
    .then(roles => {
      if (this.cacheable) {
        this.cacheable()
      }

      // Also add plugin manifests as dependencies
      roles.plugins.forEach(plugin => {
        this.addDependency(path.join(plugin.path, 'sanity.json'))
      })

      const roleName = `style:${query.style}`

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
        setImmediate(callback, null, files.reduceRight(reduceCss, css))
      }).catch(err => setImmediate(callback, err))
    })
    .catch(err => setImmediate(callback, err))
}

function reduceCss(currentCss, fulfiller) {
  let css = `/* Plugin: ${fulfiller.plugin} */\n`
  css += fulfiller.css

  return `${currentCss}${css}`
}

module.exports = sanityStyleLoader
