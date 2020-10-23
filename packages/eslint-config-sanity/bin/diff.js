/* eslint-disable no-console */
const difference = require('lodash.difference')
const latest = Object.keys(require('eslint/conf/eslint-all').rules)
const base = Object.keys(require('..').rules)
const latestReactRules = Object.keys(require('eslint-plugin-react').rules).map((ruleName) => {
  return `react/${ruleName}`
})
const existingReactRules = Object.keys(require('../react').rules)

const replacements = require('eslint/conf/replacements.json').rules

const addedRules = difference(latest, base)
let removedRules = difference(base, latest)

const replacedRules = removedRules.filter((removed) => {
  return removed in replacements
})

removedRules = difference(removedRules, replacedRules)

const replacedRuleMapping = replacedRules.map((removed) => {
  return {from: removed, to: replacements[removed]}
})

function printRules(rules) {
  if (!rules.length) {
    return '  None'
  }
  return `  ${rules.join('\n  ')}`
}

console.log('New rules: \n%s', printRules(addedRules))
console.log('Removed rules: \n%s', printRules(removedRules))
console.log(
  'Replaced rules: \n%s',
  printRules(
    replacedRuleMapping.map((repl) => {
      return `${repl.from} => ${repl.to}`
    })
  )
)

console.log()

const addedReactRules = difference(latestReactRules, existingReactRules)
const removeReactRules = difference(existingReactRules, latestReactRules)
console.log('--- eslint-plugin-react ---')
console.log('New rules: \n%s', printRules(addedReactRules))
console.log('Removed rules: \n%s', printRules(removeReactRules))
