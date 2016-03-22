'use strict'

const path = require('path')
const escapeRegExp = require('lodash/escapeRegExp')
const postcss = require('postcss')

const fromMatcher = /^(.+?\s+from\s+)["'](\..*?)["']$/

function getRuleCompositionMatcher(role) {
  return new RegExp(`^(.+?)\\s+from\\s+(["']${escapeRegExp(role)}["'])$`, 'i')
}

function removeSelfReferencing(role) {
  const matcher = getRuleCompositionMatcher(role)
  return css => css.replaceValues(
    matcher,
    {props: ['composes'], fast: role},
    value => value.replace(matcher, '$1')
  )
}

function removeSelfComposing(css) {
  css.walkRules(rule => {
    rule.walkDecls(/^composes$/i, decl => {
      if (decl.value === decl.parent.selector.substring(1)) {
        decl.remove()
      }
    })
  })
}

function makePathsRelativeToConfiguredPath(file) {
  return css => css.replaceValues(
    fromMatcher,
    {props: ['composes']},
    value => {
      const match = value.match(fromMatcher)
      const originDir = path.dirname(file.path)
      const relative = path.join(originDir, match[2])
      const absolute = path.resolve(originDir, relative)
      return `${match[1]}"${path.relative(file.relativeTo, absolute)}"`
    }
  )
}

function rewriteCss(item) {
  const plugins = [
    removeSelfReferencing(item.role),
    removeSelfComposing,
    makePathsRelativeToConfiguredPath(item)
  ]

  return postcss(plugins)
    .process(item.css)
    .then(res => Object.assign({}, item, {css: res.css}))
}

module.exports = rewriteCss
