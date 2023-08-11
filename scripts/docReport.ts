import path from 'path'
import fs from 'fs'
import {cwd} from 'process'
import ts from 'typescript'

const ALLOWED_TAGS = ['public', 'alpha', 'beta', 'internal', 'experimental', 'deprecated']

function getTags(node: ts.Node) {
  const tags = ts.getJSDocTags(node).map((tag) => tag.tagName.getText())
  return tags.filter((tag) => ALLOWED_TAGS.includes(tag))
}

function getDocReport(exportPath: string) {
  // Read the .d.ts file
  const sourceFile = ts.createSourceFile(
    exportPath,
    fs.readFileSync(path.resolve(cwd(), `packages/sanity/lib/exports/${exportPath}`)).toString(),
    // from tsconfig.settings.json
    ts.ScriptTarget.ES2017,
    true
  )

  const exportNames: {name?: string; tags: string[]}[] = []

  sourceFile.forEachChild((node) => {
    // Get all the export items that are named or default export
    const exportedItem = ts
      .getModifiers(node as ts.HasModifiers)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)

    if (exportedItem) {
      let name

      if (node.kind === ts.SyntaxKind.VariableStatement) {
        name = (node as ts.VariableStatement).declarationList.declarations[0].name.getText()
      } else {
        name = (
          node as ts.FunctionDeclaration | ts.ClassDeclaration | ts.InterfaceDeclaration
        ).name?.getText()
      }

      const tags = getTags(node)

      exportNames.push({name, tags})
    }
  })

  return exportNames
}

// todo: make it work for different packages
fs.readdir(path.resolve(cwd(), 'packages/sanity/lib/exports'), (err, files) => {
  if (err) {
    console.error(err)
    return
  }

  const result = files
    .map((file) => {
      if (file.endsWith('.d.ts')) {
        return {
          packageName: `sanity${file === 'index.d.ts' ? '' : `/${file.replace('.d.ts', '')}`}`,
          properties: getDocReport(file),
        }
      }

      return undefined
    })
    .filter(Boolean)

  // TODO: Store this in studio
  console.log(result)
})
