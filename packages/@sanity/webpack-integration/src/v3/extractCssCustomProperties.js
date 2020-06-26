/* eslint-disable max-depth, no-console */

import fs from 'fs'
import color from 'css-color-function'
import postcss from 'postcss'
import postcssCalc from 'postcss-calc'
import postcssColorFunction from 'postcss-color-function'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssImport from 'postcss-import'

const VAR_RE = /var\([\s+]?(--[A-Za-z0-9-]+)[\s+]?\)/g

export async function extractCssCustomProperties(filePath) {
  const processor = postcss([
    postcssImport(),
    postcssCustomProperties({preserve: true}),
    postcssCalc(),
    postcssColorFunction({preserveCustomProps: true})
  ])

  // eslint-disable-next-line no-sync
  const code = fs.readFileSync(filePath)

  const result = await processor.process(code, {from: filePath})

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
