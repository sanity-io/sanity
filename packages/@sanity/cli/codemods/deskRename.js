// @ts-check
deskRename.parser = 'tsx'
module.exports = deskRename

const renamed = {
  DeskToolContextValue: 'StructureToolContextValue',
  DeskToolFeatures: 'StructureToolFeatures',
  DeskToolMenuItem: 'StructureToolMenuItem',
  DeskToolOptions: 'StructureToolOptions',
  DeskToolPaneActionHandler: 'StructureToolPaneActionHandler',
  DeskToolProvider: 'StructureToolProvider',
  DeskToolProviderProps: 'StructureToolProviderProps',
  deskTool: 'structureTool',
  useDeskTool: 'useStructureTool',
}

function isFunction(renamedThing) {
  return renamedThing === 'deskTool' || renamedThing === 'useDeskTool'
}

function isComponent(renamedThing) {
  return renamedThing === 'DeskToolProvider'
}

function deskRename(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const renamedFunctions = new Set()
  const renamedComponents = new Set()

  // Imports
  // from: import {deskTool} from 'sanity/desk'
  //   to: import {structureTool} from 'sanity/structure'
  //
  // from: import {StructureBuilder} from 'sanity/desk'
  //   to: import {StructureBuilder} from 'sanity/structure'
  root
    .find(api.jscodeshift.ImportDeclaration, (node) => node.source.value.startsWith('sanity/desk'))
    .filter((path) => path.node.source.value.startsWith('sanity/desk'))
    .forEach((path) => {
      const newSpecifiers = []

      j(path)
        .find(j.ImportSpecifier)
        .forEach((specifier) => {
          const oldName = specifier.node.imported.name
          const aliasName = specifier.node.local.name
          const isAliased = oldName !== aliasName
          if (!(oldName in renamed)) {
            newSpecifiers.push(specifier.node)
            return
          }

          const newName = renamed[oldName]
          const targetName = isAliased ? aliasName : newName
          if (newName === targetName) {
            newSpecifiers.push(j.importSpecifier(j.identifier(newName)))
            if (isComponent(oldName)) {
              renamedComponents.add(oldName)
            } else if (isFunction(oldName)) {
              renamedFunctions.add(oldName)
            }
          } else {
            newSpecifiers.push(j.importSpecifier(j.identifier(newName), j.identifier(targetName)))
          }
        })

      j(path).replaceWith(j.importDeclaration(newSpecifiers, j.literal('sanity/structure')))
    })

  // Requires
  // from: const {deskTool} = require('sanity/desk')
  //   to: const {structureTool} = require('sanity/structure')
  //
  // from: const {StructureBuilder} = require('sanity/desk')
  //   to: const {StructureBuilder} = require('sanity/structure')
  root
    .find(api.jscodeshift.VariableDeclarator, {
      id: {type: 'ObjectPattern'},
      init: {callee: {name: 'require'}},
    })
    .filter((path) => path.value.init.arguments[0].value.startsWith('sanity/desk'))
    .forEach((path) => {
      const newProperties = []
      j(path)
        .find(j.ObjectProperty)
        .forEach((prop) => {
          const oldName = prop.node.key.name
          const aliasName = prop.node.value.name
          const isAliased = oldName !== aliasName
          const newName = renamed[oldName]
          if (!newName) {
            newProperties.push(prop.node)
            return
          }

          const targetName = isAliased ? aliasName : newName
          const newProp = j.objectProperty(
            j.identifier(newName),
            j.identifier(targetName),
            false,
            true,
          )

          if (newName === targetName) {
            newProp.shorthand = true
          }
          newProperties.push(newProp)

          if (!isAliased) {
            if (isComponent(oldName)) {
              renamedComponents.add(oldName)
            } else if (isFunction(oldName)) {
              renamedFunctions.add(oldName)
            }
          }
        })

      j(path).replaceWith(
        j.variableDeclarator(
          j.objectPattern(newProperties),
          j.callExpression(j.identifier('require'), [j.stringLiteral('sanity/structure')]),
        ),
      )
    })

  // Replace all remapped instances on a best-effort basis
  renamedComponents.forEach((oldName) => {
    const newName = renamed[oldName]
    root
      .find(api.jscodeshift.JSXIdentifier, {name: oldName})
      .forEach((path) => j(path).replaceWith(j.jsxIdentifier(newName)))
  })

  renamedFunctions.forEach((oldName) => {
    const newName = renamed[oldName]
    root.find(api.jscodeshift.CallExpression, {callee: {name: oldName}}).forEach((path) => {
      j(path).replaceWith(j.callExpression(j.identifier(newName), path.node.arguments))
    })
  })

  return root.toSource()
}
