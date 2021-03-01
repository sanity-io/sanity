const splitRegexp = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g]
const stripRegexp = /[^A-Z0-9]+/gi

fixIcons.parser = 'tsx'
module.exports = fixIcons

function fixIcons(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Imports
  // from: import {MdPerson} from 'react-icons/lib/md'
  //   to: import {MdPerson} from 'react-icons/md'
  //
  // from: import PersonIcon from 'react-icons/lib/md/person'
  //   to: import {MdPerson as PersonIcon} from 'react-icons/md'
  root
    .find(api.jscodeshift.ImportDeclaration, (node) => node.source.value.startsWith('react-icons/'))
    .filter((path) => isLegacyPath(path.node.source.value))
    .forEach((path) => {
      const node = path.value
      const icon = iconSpecFromPath(node.source.value)

      if (!icon) {
        // import {MdPerson} from 'react-icons/lib/md' => import {MdPerson} from 'react-icons/md'
        node.source.value = node.source.value.replace(/react-icons\/lib/, 'react-icons')
        return
      }

      // import MdPerson from 'react-icons/lib/md/person' => import {MdPerson} from 'react-icons/md'
      const oldName = path.value.specifiers[0].local.name
      j(path).replaceWith(
        j.importDeclaration(
          [j.importSpecifier(j.identifier(icon.name), j.identifier(oldName))],
          j.literal(`react-icons/${icon.pack}`)
        )
      )
    })

  // Requires
  // from: const PersonIcon = require('react-icons/lib/md/person'
  //   to: const {MdPerson: PersonIcon} = require('react-icons/md')
  //
  // from: const {MdPerson} = require('react-icons/lib/md')
  //   to: const {MdPerson} = require('react-icons/md')
  root
    .find(j.VariableDeclarator, {
      id: {type: 'Identifier'},
      init: {callee: {name: 'require'}},
    })
    .filter((path) => isLegacyPath(path.value.init.arguments[0].value))
    .forEach((path) => {
      const oldName = path.value.id.name
      const filePath = path.value.init.arguments[0].value
      const icon = iconSpecFromPath(filePath)
      const prop = j.objectProperty(j.identifier(icon.name), j.identifier(oldName), false, true)
      if (oldName === icon.name) {
        prop.shorthand = true
      }

      j(path).replaceWith(
        j.variableDeclarator(
          j.objectPattern([prop]),
          j.callExpression(j.identifier('require'), [j.stringLiteral(`react-icons/${icon.pack}`)])
        )
      )
    })

  return root.toSource()
}

function pascalCase(input) {
  const inner = replace(input, splitRegexp, '$1\0$2')
  const result = replace(inner, stripRegexp, '\0')
  return result.slice(0, result.length).split('\0').map(pascalCaseTransform).join('')
}

function replace(input, re, value) {
  if (re instanceof RegExp) return input.replace(re, value)
  return re.reduce((str, pattern) => str.replace(pattern, value), input)
}

function pascalCaseTransform(input) {
  const firstChar = input.charAt(0)
  const lowerChars = input.substr(1).toLowerCase()
  return `${firstChar.toUpperCase()}${lowerChars}`
}

function iconSpecFromPath(path) {
  const [, pack, icon] =
    path.match(/(ai|bi|bs|cg|di|fa|fc|fi|gi|go|gr|hi|im|io|md|ri|si|src|ti|vsc|wi)\/(.*)/) || []

  if (!pack) {
    return undefined
  }

  const prefix = pack[0].toUpperCase() + pack.slice(1)
  const suffix = pascalCase(icon.replace(/\.jsx?$/, ''))
  return {pack, name: prefix + suffix}
}

function isLegacyPath(path) {
  return /^react-icons\/(lib\/)?(ai|bi|bs|cg|di|fa|fc|fi|gi|go|gr|hi|im|io|md|ri|si|src|ti|vsc|wi)/.test(
    path
  )
}
