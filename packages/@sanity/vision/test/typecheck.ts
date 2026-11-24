import {execFile} from 'node:child_process'
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {promisify} from 'node:util'

const run = promisify(execFile)

const PACKAGE_ROOT = dirname(import.meta.dirname)

export interface PrintedParams {
  typeName: string
  typescript: string
  zod: string
}

/** A fresh directory inside the package (in the gitignored `.vitest/`), where `zod` resolves */
async function packageTempDir(prefix: string): Promise<string> {
  const parent = join(PACKAGE_ROOT, '.vitest')
  await mkdir(parent, {recursive: true})
  return mkdtemp(join(parent, prefix))
}

/**
 * Type-checks printed params under strict `tsc`, along with a check that the Zod schema infers
 * exactly the TypeScript type. Module `m<index>` is `printed[index]`. Returns the diagnostics,
 * empty when everything checks.
 */
export async function typecheckParams(printed: PrintedParams[]): Promise<string> {
  const dir = await packageTempDir('typecheck-')
  try {
    await writeFile(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: 'es2022',
          module: 'preserve',
          moduleResolution: 'bundler',
          verbatimModuleSyntax: true,
          allowImportingTsExtensions: true,
          types: [],
        },
        include: ['*.ts'],
      }),
    )
    await writeFile(
      join(dir, 'equal.ts'),
      'export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false\n',
    )
    await Promise.all(
      printed.flatMap(({typeName, typescript, zod}, index) => [
        writeFile(join(dir, `m${index}.ts`), `${typescript}\n`),
        writeFile(join(dir, `m${index}.zod.ts`), `${zod}\n`),
        writeFile(
          join(dir, `m${index}.check.ts`),
          [
            `import type {Equal} from './equal.ts'`,
            `import type {${typeName} as FromTypeScript} from './m${index}.ts'`,
            `import type {${typeName} as FromZod} from './m${index}.zod.ts'`,
            '',
            'export const agree: Equal<FromTypeScript, FromZod> = true',
            '',
          ].join('\n'),
        ),
      ]),
    )
    try {
      await run(join(PACKAGE_ROOT, 'node_modules/.bin/tsc'), ['-p', dir, '--pretty', 'false'])
      return ''
    } catch (error) {
      if (!(error instanceof Error)) throw error
      return output(error, 'stdout') || output(error, 'stderr') || error.message
    }
  } finally {
    await rm(dir, {recursive: true, force: true})
  }
}

/**
 * Imports a TypeScript module from inside the package and returns its exports, so its imports
 * resolve to the package's own dependencies, as they would in an app that depends on them
 */
export async function importModule(source: string): Promise<Record<string, unknown>> {
  const dir = await packageTempDir('import-')
  try {
    const file = join(dir, 'module.ts')
    await writeFile(file, `${source}\n`)
    return await import(/* @vite-ignore */ file)
  } finally {
    await rm(dir, {recursive: true, force: true})
  }
}

/** What a failed `execFile` printed to one of its streams */
function output(error: Error, stream: 'stdout' | 'stderr'): string {
  const printed: unknown = Reflect.get(error, stream)
  return typeof printed === 'string' ? printed : ''
}
