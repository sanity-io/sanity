const os = require('os')
const path = require('path')
const fse = require('fs-extra')
const json5 = require('json5')
const uuid = require('@sanity/uuid')
const execa = require('execa')
const chokidar = require('chokidar')
const {isPlainObject, isEqual, noop} = require('lodash')

const helpText = `
Options
  --replace On duplicate document IDs, replace existing document with specified document(s)
  --missing On duplicate document IDs, don't modify the target document(s)
  --watch   Write the documents whenever the target file or buffer changes
  --json5   Use JSON5 file type to allow a "simplified" version of JSON
  --id <id> Specify a document ID to use. Will fetch remote document ID and populate editor.

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

export default {
  name: 'create',
  group: 'documents',
  signature: '[FILE]',
  helpText,
  description: 'Create one or more documents',
  // eslint-disable-next-line complexity
  action: async (args, context) => {
    const {apiClient, output} = context
    const {replace, missing, watch, id} = args.extOptions
    const [file] = args.argsWithoutOptions
    const client = apiClient()
    const useJson5 = args.extOptions.json5

    if (replace && missing) {
      throw new Error('Cannot use both --replace and --missing')
    }

    if (id && file) {
      throw new Error('Cannot use --id when specifying a file path')
    }

    let operation = 'create'
    if (replace || missing) {
      operation = replace ? 'createOrReplace' : 'createIfNotExists'
    }

    if (file) {
      const contentPath = path.resolve(process.cwd(), file)
      const content = json5.parse(await fse.readFile(contentPath, 'utf8'))
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
    await fse.outputFile(tmpFile, stringify(defaultValue, null, 2))

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
      await fse.unlink(tmpFile).catch(noop)
    }

    async function readAndPerformCreatesFromFile(filePath) {
      let content
      try {
        content = json5.parse(await fse.readFile(filePath, 'utf8'))
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
  }
}

function registerUnlinkOnSigInt(tmpFile) {
  process.on('SIGINT', async () => {
    await fse.unlink(tmpFile).catch(noop)
    // eslint-disable-next-line no-process-exit
    process.exit(130)
  })
}

function writeDocuments(documents, operation, client) {
  const docs = Array.isArray(documents) ? documents : [documents]
  if (!docs.length === 0) {
    throw new Error('No documents provided')
  }

  docs.forEach(validateDocument)
  return client.transaction(docs.map(doc => ({[operation]: doc}))).commit()
}

function validateDocument(doc, index, arr) {
  const isSingle = arr.length === 1

  if (!isPlainObject(doc)) {
    throw new Error(getErrorMessage('must be an object', index, isSingle))
  }

  if (typeof doc._type !== 'string') {
    throw new Error(getErrorMessage('must have a `_type` property of type string', index, isSingle))
  }
}

function getErrorMessage(message, index, isSingle) {
  return isSingle ? `Document ${message}` : `Document at index ${index} ${message}`
}

function getResultMessage(result, operation) {
  const joiner = '\n  - '
  if (operation === 'createOrReplace') {
    return `Upserted:\n  - ${result.results.map(res => res.id).join(joiner)}`
  }

  if (operation === 'create') {
    return `Created:\n  - ${result.results.map(res => res.id).join(joiner)}`
  }

  // "Missing" (createIfNotExists)
  const {created, skipped} = result.results.reduce(
    (acc, res) => {
      const mod = res.operation === 'update' ? 'skipped' : 'created'
      acc[mod].push(res.id)
      return acc
    },
    {created: [], skipped: []}
  )

  if (created.length > 0 && skipped.length > 0) {
    return [
      `Created:\n  - ${created.join(joiner)}`,
      `Skipped (already exists):${joiner}${skipped.join(joiner)}`
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
  const bin = args.shift()
  return {bin, args}
}
