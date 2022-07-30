import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import type {CliCommandDefinition} from '@sanity/cli'
import type {
  SanityClient,
  MultipleMutationResult,
  Mutation,
  IdentifiedSanityDocumentStub,
} from '@sanity/client'
import json5 from 'json5'
import execa from 'execa'
import chokidar from 'chokidar'
import {isPlainObject, isEqual, noop} from 'lodash'
import {uuid} from '@sanity/uuid'

type MutationOperationName = 'create' | 'createOrReplace' | 'createIfNotExists'

interface CreateFlags {
  dataset?: string
  replace?: boolean
  missing?: boolean
  watch?: boolean
  json5?: boolean
  id?: string
}

const helpText = `
Options
  --replace On duplicate document IDs, replace existing document with specified document(s)
  --missing On duplicate document IDs, don't modify the target document(s)
  --watch   Write the documents whenever the target file or buffer changes
  --json5   Use JSON5 file type to allow a "simplified" version of JSON
  --id <id> Specify a document ID to use. Will fetch remote document ID and populate editor.
  --dataset NAME to override dataset

Examples
  # Create the document specified in "myDocument.json".
  sanity documents create myDocument.json

  # Open configured $EDITOR and create the specified document(s)
  sanity documents create

  # Fetch document with the ID "myDocId" and open configured $EDITOR with the
  # current document content (if any). Replace document with the edited version
  # when the editor closes
  sanity documents create --id myDocId --replace

  # Open configured $EDITOR and replace the document with the given content
  # on each save. Use JSON5 file extension and parser for simplified syntax.
  sanity documents create --id myDocId --watch --replace --json5
`

const createDocumentsCommand: CliCommandDefinition<CreateFlags> = {
  name: 'create',
  group: 'documents',
  signature: '[FILE]',
  helpText,
  description: 'Create one or more documents',
  // eslint-disable-next-line complexity
  action: async (args, context) => {
    const {apiClient, output} = context
    const {replace, missing, watch, id, dataset} = args.extOptions
    const [file] = args.argsWithoutOptions
    const useJson5 = args.extOptions.json5
    const client = dataset ? apiClient().clone().config({dataset}) : apiClient()

    if (replace && missing) {
      throw new Error('Cannot use both --replace and --missing')
    }

    if (id && file) {
      throw new Error('Cannot use --id when specifying a file path')
    }

    let operation: MutationOperationName = 'create'
    if (replace || missing) {
      operation = replace ? 'createOrReplace' : 'createIfNotExists'
    }

    if (file) {
      const contentPath = path.resolve(process.cwd(), file)
      const content = json5.parse(await fs.readFile(contentPath, 'utf8'))
      const result = await writeDocuments(content, operation, client)
      output.print(getResultMessage(result, operation))
      return
    }

    // Create a temporary file and use that as source, opening an editor on it
    const docId = id || uuid()
    const ext = useJson5 ? 'json5' : 'json'
    const tmpFile = path.join(os.tmpdir(), 'sanity-cli', `${docId}.${ext}`)
    const stringify = useJson5 ? json5.stringify : JSON.stringify
    const defaultValue = (id && (await client.getDocument(id))) || {_id: docId, _type: 'specify-me'}
    await fs.mkdir(path.join(os.tmpdir(), 'sanity-cli'), {recursive: true})
    await fs.writeFile(tmpFile, stringify(defaultValue, null, 2), 'utf8')

    const editor = getEditor()
    if (watch) {
      // If we're in watch mode, we want to run the creation on each change (if it validates)
      registerUnlinkOnSigInt(tmpFile)
      output.print(`Watch mode: ${tmpFile}`)
      output.print('Watch mode: Will write documents on each save.')
      output.print('Watch mode: Press Ctrl + C to cancel watch mode.')
      chokidar.watch(tmpFile).on('change', () => {
        output.print('')
        return readAndPerformCreatesFromFile(tmpFile)
      })
      execa(editor.bin, editor.args.concat(tmpFile), {stdio: 'inherit'})
    } else {
      // While in normal mode, we just want to wait for the editor to close and run the thing once
      execa.sync(editor.bin, editor.args.concat(tmpFile), {stdio: 'inherit'})
      await readAndPerformCreatesFromFile(tmpFile)
      await fs.unlink(tmpFile).catch(noop)
    }

    async function readAndPerformCreatesFromFile(filePath: string) {
      let content
      try {
        content = json5.parse(await fs.readFile(filePath, 'utf8'))
      } catch (err) {
        output.error(`Failed to read input: ${err.message}`)
        return
      }

      if (isEqual(content, defaultValue)) {
        output.print('Value not modified, doing nothing.')
        output.print('Modify document to trigger creation.')
        return
      }

      try {
        const writeResult = await writeDocuments(content, operation, client)
        output.print(getResultMessage(writeResult, operation))
      } catch (err) {
        output.error(`Failed to write documents: ${err.message}`)
        if (err.message.includes('already exists')) {
          output.error('Perhaps you want to use `--replace` or `--missing`?')
        }
      }
    }
  },
}

function registerUnlinkOnSigInt(tmpFile: string) {
  process.on('SIGINT', async () => {
    await fs.unlink(tmpFile).catch(noop)
    // eslint-disable-next-line no-process-exit
    process.exit(130)
  })
}

function writeDocuments(
  documents: {_id?: string; _type: string} | {_id?: string; _type: string}[],
  operation: MutationOperationName,
  client: SanityClient
) {
  const docs = Array.isArray(documents) ? documents : [documents]
  if (docs.length === 0) {
    throw new Error('No documents provided')
  }

  const mutations = docs.map((doc, index): Mutation => {
    validateDocument(doc, index, docs)
    if (operation === 'create') {
      return {create: doc}
    }

    if (operation === 'createIfNotExists') {
      if (isIdentifiedSanityDocument(doc)) {
        return {createIfNotExists: doc}
      }

      throw new Error(`Missing required _id attribute for ${operation}`)
    }

    if (operation === 'createOrReplace') {
      if (isIdentifiedSanityDocument(doc)) {
        return {createOrReplace: doc}
      }

      throw new Error(`Missing required _id attribute for ${operation}`)
    }

    throw new Error(`Unsupported operation ${operation}`)
  })

  return client.transaction(mutations).commit()
}

function validateDocument(doc: unknown, index: number, arr: unknown[]) {
  const isSingle = arr.length === 1

  if (!isPlainObject(doc)) {
    throw new Error(getErrorMessage('must be an object', index, isSingle))
  }

  if (!isSanityDocumentish(doc)) {
    throw new Error(getErrorMessage('must have a `_type` property of type string', index, isSingle))
  }
}

function isSanityDocumentish(doc: unknown): doc is {_type: string} {
  return (
    doc !== null &&
    typeof doc === 'object' &&
    '_type' in doc &&
    typeof (doc as any)._type === 'string'
  )
}

function isIdentifiedSanityDocument(doc: unknown): doc is IdentifiedSanityDocumentStub {
  return isSanityDocumentish(doc) && '_id' in doc
}

function getErrorMessage(message: string, index: number, isSingle: boolean): string {
  return isSingle ? `Document ${message}` : `Document at index ${index} ${message}`
}

function getResultMessage(
  result: MultipleMutationResult,
  operation: MutationOperationName
): string {
  const joiner = '\n  - '
  if (operation === 'createOrReplace') {
    return `Upserted:\n  - ${result.results.map((res) => res.id).join(joiner)}`
  }

  if (operation === 'create') {
    return `Created:\n  - ${result.results.map((res) => res.id).join(joiner)}`
  }

  // "Missing" (createIfNotExists)
  const created: string[] = []
  const skipped: string[] = []
  for (const res of result.results) {
    if (res.operation === 'update') {
      skipped.push(res.id)
    } else {
      created.push(res.id)
    }
  }

  if (created.length > 0 && skipped.length > 0) {
    return [
      `Created:\n  - ${created.join(joiner)}`,
      `Skipped (already exists):${joiner}${skipped.join(joiner)}`,
    ].join('\n\n')
  } else if (created.length > 0) {
    return `Created:\n  - ${created.join(joiner)}`
  }

  return `Skipped (already exists):\n  - ${skipped.join(joiner)}`
}

function getEditor() {
  const defaultEditor = /^win/.test(process.platform) ? 'notepad' : 'vim'
  // eslint-disable-next-line no-process-env
  const editor = process.env.VISUAL || process.env.EDITOR || defaultEditor
  const args = editor.split(/\s+/)
  const bin = args.shift() || ''
  return {bin, args}
}

export default createDocumentsCommand
