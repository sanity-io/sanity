import * as fs from 'node:fs'

import {parseSync} from 'oxc-parser'

export type ReleaseTag = 'public' | 'beta' | 'alpha' | 'internal' | 'hidden' | 'none'

const TAG = /@(public|beta|alpha|internal|hidden)\b/

interface Declaration {
  start: number
  end: number
}

interface FileIndex {
  source: string
  comments: {value: string; start: number; end: number}[]
  declarations: Map<string, Declaration>
  /** `export {local as exported}` statements, by exported name. */
  exportStatements: Map<string, Declaration>
}

/**
 * Reads the TSDoc release tag of exported declarations from the original source files (the
 * build's transformed code has no comments). The tag is taken from the closest `/** *\/` block
 * that precedes the declaration, and when the declaration has none, from the one preceding the
 * `export {…}` statement that exports it.
 */
export class ReleaseTags {
  readonly #files = new Map<string, FileIndex | null>()

  tag(moduleId: string, localName: string): ReleaseTag {
    const file = this.#index(moduleId)
    if (!file) return 'none'
    const declaration =
      localName === 'default'
        ? file.declarations.get('default')
        : (file.declarations.get(localName) ?? file.exportStatements.get(localName))
    if (!declaration) return 'none'
    const fromDeclaration = this.#tagBefore(file, declaration.start)
    if (fromDeclaration) return fromDeclaration
    const statement = file.exportStatements.get(localName)
    return (statement && this.#tagBefore(file, statement.start)) || 'none'
  }

  #tagBefore(file: FileIndex, start: number): ReleaseTag | undefined {
    let match: {value: string; end: number} | undefined
    for (const comment of file.comments) {
      if (comment.end > start) break
      match = comment
    }
    if (!match || !match.value.startsWith('*')) return undefined
    const between = file.source.slice(match.end, start)
    if (!/^[\s]*(export\s+)?(default\s+)?(declare\s+)?$/.test(between)) return undefined
    return (TAG.exec(match.value)?.[1] as ReleaseTag | undefined) ?? undefined
  }

  #index(moduleId: string): FileIndex | null {
    const filename = moduleId.replace(/\?.*$/, '')
    if (this.#files.has(filename)) return this.#files.get(filename)!
    let index: FileIndex | null = null
    if (/\.[cm]?[jt]sx?$/.test(filename) && fs.existsSync(filename)) {
      const source = fs.readFileSync(filename, 'utf8')
      const result = parseSync(filename, source)
      index = {
        source,
        comments: result.comments
          .filter((comment) => comment.type === 'Block')
          .map((comment) => ({value: comment.value, start: comment.start, end: comment.end})),
        declarations: new Map(),
        exportStatements: new Map(),
      }
      for (const statement of result.program.body as Node[]) {
        collectDeclarations(statement, statement.start, index)
      }
    }
    this.#files.set(filename, index)
    return index
  }
}

interface Node {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

function collectDeclarations(statement: Node, start: number, index: FileIndex): void {
  const add = (name: unknown) => {
    if (typeof name === 'string' && !index.declarations.has(name)) {
      index.declarations.set(name, {start, end: statement.end})
    }
  }
  switch (statement.type) {
    case 'ExportNamedDeclaration': {
      const declaration = statement['declaration'] as Node | null
      if (declaration) {
        collectDeclarations(declaration, statement.start, index)
        return
      }
      for (const specifier of (statement['specifiers'] as Node[]) ?? []) {
        const exported = specifier['exported'] as {name?: string; value?: string}
        const name = exported.name ?? exported.value
        if (name) index.exportStatements.set(name, {start: statement.start, end: statement.end})
      }
      return
    }
    case 'ExportDefaultDeclaration':
      index.declarations.set('default', {start: statement.start, end: statement.end})
      return
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
    case 'TSEnumDeclaration':
    case 'TSDeclareFunction':
      add((statement['id'] as {name?: string} | null)?.name)
      return
    case 'VariableDeclaration':
      for (const declarator of (statement['declarations'] as Node[]) ?? []) {
        add((declarator['id'] as {name?: string}).name)
      }
      return
    default:
      return
  }
}
