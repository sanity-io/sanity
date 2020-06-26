/* eslint-disable max-depth, no-console */

const fs = require('fs')
const util = require('util')
const color = require('css-color-function')
const postcss = require('postcss')
const postcssCalc = require('postcss-calc')
const postcssColorFunction = require('postcss-color-function')
const postcssCustomProperties = require('postcss-custom-properties')
const {getPostcssImportPlugin} = require('./postcss')

const readFile = util.promisify(fs.readFile)

const VAR_RE = /var\([\s+]?(--[A-Za-z0-9-]+)[\s+]?\)/g

async function extractCssCustomProperties(basePath, entryPath) {
  const processor = postcss([
    getPostcssImportPlugin({basePath}),
    postcssCustomProperties({preserve: true}),
    postcssCalc(),
    postcssColorFunction({preserveCustomProps: true})
  ])

  const code = await readFile(entryPath)
  const result = await processor.process(code, {from: entryPath})

  const customProperties = {}

  // Walk AST and collect :root custom properties (starting with `--`)
  result.root.nodes.forEach(node => {
    if (node.type === 'rule' && node.selector === ':root') {
      node.nodes.forEach(ruleNode => {
        if (ruleNode.prop && ruleNode.prop.startsWith('--')) {
          customProperties[ruleNode.prop] = ruleNode.value.replace(/(?:\r\n|\r|\n)/g, ' ')
        }
      })
    }
  })

  // Loop and replace `var(--name)` if exists in scope
  // NOTE: It runs in 3 passes to evaluate all variable references
  for (let i = 0; i < 3; i += 1) {
    for (const [key, value] of Object.entries(customProperties)) {
      const match = VAR_RE.exec(value)

      if (match) {
        if (customProperties[match[1]]) {
          customProperties[key] = value.replace(match[0], customProperties[match[1]])
        }
      }
    }
  }

  // Loop and evaluate color function
  for (const [key, value] of Object.entries(customProperties)) {
    if (value.startsWith('color(')) {
      try {
        customProperties[key] = color.convert(value)
      } catch (convertErr) {
        console.warn(`could not convert color \`${key}: ${value}\``)
      }
    }
  }

  return customProperties
}

module.exports = extractCssCustomProperties
