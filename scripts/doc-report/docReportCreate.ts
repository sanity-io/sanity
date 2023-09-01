import path from 'path'
import fs from 'fs'
import ts, {type JSDoc, type JSDocComment, SyntaxKind} from 'typescript'
import {
  at,
  createIfNotExists,
  type Mutation,
  patch,
  SanityEncoder,
  set,
  setIfMissing,
  upsert,
} from '@bjoerge/mutiny'
import {filter, map, mergeMap, of, tap} from 'rxjs'
import readPackages from '../utils/readPackages'
import type {PackageManifest} from '../types'
import {sanityIdify} from '../utils/sanityIdify'
import {startTimer} from '../utils/startTimer'
import {createDocClient} from './docClient'
import {readEnv} from 'sanity-perf-tests/config/envVars'

const ALLOWED_TAGS = ['public', 'alpha', 'beta', 'internal', 'experimental', 'deprecated']
interface Package {
  path: string
  dirname: string
  manifest: PackageManifest
}
function getTags(node: ts.Node) {
  const tags = ts.getJSDocTags(node).map((tag) => tag.tagName.getText())
  return tags.filter((tag) => ALLOWED_TAGS.includes(tag))
}

type SyntaxType = 'function' | 'class' | 'interface' | 'variable' | 'typeAlias' | 'enum' | 'module'

function getComment(comment: string | ts.NodeArray<JSDocComment>) {
  // eslint-disable-next-line no-nested-ternary
  return typeof comment === 'string' ? [comment] : comment.flatMap((c) => c.text)
}

function getCommentFromJSDoc(t: ts.JSDoc) {
  return t.comment ? getComment(t.comment) : []
}

function getName(node: ts.Node) {
  if (node.kind === ts.SyntaxKind.VariableStatement) {
    return (node as ts.VariableStatement).declarationList.declarations[0].name.getText()
  }
  return (
    node as ts.FunctionDeclaration | ts.ClassDeclaration | ts.InterfaceDeclaration
  ).name?.getText()
}

function getNodeType(node: ts.Node): SyntaxType {
  if (node.kind === ts.SyntaxKind.VariableStatement) {
    return 'variable'
  }
  if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
    return 'interface'
  }
  if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
    return 'function'
  }
  if (node.kind === ts.SyntaxKind.ClassDeclaration) {
    return 'class'
  }
  if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
    return 'typeAlias'
  }
  if (node.kind === ts.SyntaxKind.EnumDeclaration) {
    return 'enum'
  }
  if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
    return 'module'
  }
  throw new Error(`Unsupported syntax kind for node: ${ts.SyntaxKind[node.kind]}`)
}

type ExportedSymbol = {
  name: string
  type: SyntaxType
  tags: string[]
  comment?: string | undefined
}

type ResolvedExport = {
  exportName: string
  normalized: string
  dtsExport: string
  dtsFilePath: string
}
function getExportedSymbols(exp: ResolvedExport): ExportedSymbol[] {
  const exportedSymbols: ExportedSymbol[] = []
  // Read the .d.ts file
  const sourceFile = ts.createSourceFile(
    exp.dtsExport!,
    fs.readFileSync(exp.dtsFilePath!).toString('utf-8'),
    // from tsconfig.settings.json
    ts.ScriptTarget.ES2017,
    true,
  )
  sourceFile.forEachChild((node) => {
    // Get all the export items that are named or default export
    const exportedItem = ts
      .getModifiers(node as ts.HasModifiers)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)

    if (exportedItem) {
      const comment = ts
        .getJSDocCommentsAndTags(node)
        .filter((t): t is JSDoc => t.kind === SyntaxKind.JSDoc)
        .flatMap((t) => getCommentFromJSDoc(t))

      const name = getName(node)
      if (!name) {
        return
      }
      const tags = getTags(node)
      const type = getNodeType(node)

      exportedSymbols.push({
        name,
        type,
        comment: comment.length > 0 ? comment.join('\n') : undefined,
        tags,
      })
    }
  })
  return exportedSymbols
}

function getResolvedExports(pkg: Package): ResolvedExport[] {
  const manifest = pkg.manifest
  return Object.entries(manifest.exports || {}).flatMap(([exportName, exportDefinition]) => {
    return exportDefinition.types
      ? {
          exportName,
          normalized: path.join(manifest.name, exportName),
          dtsExport: exportDefinition.types,
          dtsFilePath: exportDefinition.types && path.join(pkg.dirname, exportDefinition.types),
        }
      : []
  })
}

function getPackageMutations(pkg: Package): Mutation[] {
  const exports = getResolvedExports(pkg)
  return exports.flatMap((exp) => {
    const exportsDocId = `package-exports-${sanityIdify(exp.normalized)}`
    const symbols = getExportedSymbols(exp)
    return [
      createIfNotExists({
        _id: exportsDocId,
        _type: 'packageExports',
      }),
      patch(exportsDocId, [
        at('name', set(exp.exportName)),
        at('normalized', set(exp.normalized)),
        at('package', set(pkg.manifest.name)),
      ]),
      ...symbols.flatMap((symbol) => {
        const symbolDocumentId = `symbol-${sanityIdify(symbol.name)}`
        return [
          createIfNotExists({
            _id: symbolDocumentId,
            _type: 'exportSymbol',
          }),
          patch(symbolDocumentId, [
            at('exportedBy', setIfMissing({_type: 'ref', _ref: exportsDocId})),
          ]),
          patch(symbolDocumentId, [
            at('name', set(symbol.name)),
            at('versions', setIfMissing([])),
            at(
              'versions',
              upsert(
                [
                  {
                    _key: pkg.manifest.version,
                    version: pkg.manifest.version,
                    type: symbol.type,
                    comment: symbol.comment,
                    tags: symbol.tags,
                    updatedAt: new Date().toISOString(),
                  },
                ],
                'before',
                0,
              ),
            ),
          ]),
        ]
      }),
    ]
  })
}

const dataset = sanityIdify(readEnv('DOCS_REPORT_DATASET'))

const studioMetricsClient = createDocClient(readEnv('DOCS_REPORT_DATASET'))

studioMetricsClient.datasets.list().then(async (datasets) => {
  // If the dataset doesn't exist, create it
  if (!datasets.find((ds) => ds.name === dataset)) {
    const timer = startTimer(`Creating dataset ${dataset}`)
    await studioMetricsClient.datasets.create(dataset, {
      aclMode: 'public',
    })
    timer.end()
  }

  of(readPackages())
    .pipe(
      tap((packages) => console.log(`Updating docs for ${packages.length} packages`)),
      mergeMap((packages) => packages),
      map((pkg) => {
        return {pkg, mutations: getPackageMutations(pkg)}
      }),
      filter(({mutations}) => mutations.length > 0),
      mergeMap(({pkg, mutations}) => {
        console.log(`Submitting ${mutations.length} mutations for ${pkg.manifest.name}`)
        return studioMetricsClient.observable.transaction(SanityEncoder.encode(mutations)).commit()
      }, 2),
    )
    .subscribe()
})
