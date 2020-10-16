/* eslint-disable max-depth, no-console, complexity */

const fs = require('fs')
const util = require('util')
const color = require('css-color-function')
const postcss = require('postcss')
const postcssCalc = require('postcss-calc')
const postcssColorFunction = require('postcss-color-function')
const postcssCustomProperties = require('postcss-custom-properties')
const {getPostcssImportPlugin} = require('./postcss')

const readFile = util.promisify(fs.readFile)

const VAR_RE = /var\([\s+]?(--[A-Za-z0-9-]+)[\s+]?\)/

async function extractCssCustomProperties(basePath, entryPath, isSanityMonorepo) {
  const processor = postcss([
    getPostcssImportPlugin({basePath, isSanityMonorepo}),
    postcssCustomProperties({preserve: true}),
    postcssCalc(),
    postcssColorFunction({preserveCustomProps: true}),
  ])

  let result
  try {
    const code = await readFile(entryPath)
    result = await processor.process(code, {from: entryPath})
  } catch (err) {
    console.error(`Failed to read CSS custom properties: ${err.message}`)
    return undefined
  }

  const customProperties = {}

  // Walk AST and collect :root custom properties (starting with `--`)
  result.root.nodes.forEach((node) => {
    if (node.type === 'rule' && node.selector === ':root') {
      node.nodes.forEach((ruleNode) => {
        if (ruleNode.prop && ruleNode.prop.startsWith('--')) {
          customProperties[ruleNode.prop] = ruleNode.value.replace(/(?:\r\n|\r|\n)/g, ' ')
        }
      })
    }
  })

  // Loop and replace `var(--name)` if exists in scope
  // NOTE: Loops in order to resolve multiple variables in the same declaration
  let hasVarRefs
  do {
    // Reset on each iteration
    hasVarRefs = false

    for (const [key, value] of Object.entries(customProperties)) {
      const [varDecl, variableName] = value.match(VAR_RE) || []

      if (varDecl && customProperties[variableName]) {
        customProperties[key] = value.replace(varDecl, customProperties[variableName])

        // If we still have variables, we call for another pass
        hasVarRefs = hasVarRefs || VAR_RE.test(customProperties[key])
      } else if (varDecl && !customProperties[variableName]) {
        console.warn(
          `variable ${customProperties[key]} references undeclared variable, "${variableName}" - skipping`
        )
        delete customProperties[key]
      }
    }
  } while (hasVarRefs)

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
