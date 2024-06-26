/**
 * Looks for and imports (in preferred order):
 *   - src/_document.js
 *   - src/_document.tsx
 *
 * Then renders using ReactDOM to a string, which is sent back to the parent
 * process over the worker `postMessage` channel.
 */
import fs from 'node:fs'
import path from 'node:path'
import {isMainThread, parentPort, Worker, workerData} from 'node:worker_threads'

import chalk from 'chalk'
import importFresh from 'import-fresh'
import {parse as parseHtml} from 'node-html-parser'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

import {getAliases} from './aliases'
import {TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT} from './constants'
import {debug as serverDebug} from './debug'
import {type SanityMonorepo} from './sanityMonorepo'

const debug = serverDebug.extend('renderDocument')

// Don't use threads in the jest world
// eslint-disable-next-line no-process-env
const useThreads = typeof process.env.JEST_WORKER_ID === 'undefined'
const hasWarnedAbout = new Set<string>()

const defaultProps = {
  entryPath: './.sanity/runtime/app.js',
}

const autoGeneratedWarning = `
This file is auto-generated from "sanity dev".
Modifications to this file are automatically discarded.
`.trim()

interface DocumentProps {
  basePath: string
  entryPath?: string
  css?: string[]
}

interface RenderDocumentOptions {
  monorepo?: SanityMonorepo
  studioRootPath: string
  props?: DocumentProps
  importMap?: {
    imports?: Record<string, string>
  }
}

export function renderDocument(options: RenderDocumentOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!useThreads) {
      resolve(getDocumentHtml(options.studioRootPath, options.props, options.importMap))
      return
    }

    debug('Starting worker thread for %s', __filename)
    const worker = new Worker(__filename, {
      execArgv: __DEV__ ? ['-r', `${__dirname}/esbuild-register.js`] : undefined,
      workerData: {...options, dev: __DEV__, shouldWarn: true},
      // eslint-disable-next-line no-process-env
      env: process.env,
    })

    worker.on('message', (msg) => {
      if (msg.type === 'warning') {
        if (hasWarnedAbout.has(msg.warnKey)) {
          return
        }

        if (Array.isArray(msg.message)) {
          msg.message.forEach((warning: string) =>
            console.warn(`${chalk.yellow('[warn]')} ${warning}`),
          )
        } else {
          console.warn(`${chalk.yellow('[warn]')} ${msg.message}`)
        }

        hasWarnedAbout.add(msg.warnKey)
        return
      }

      if (msg.type === 'error') {
        debug('Error from worker: %s', msg.error || 'Unknown error')
        reject(new Error(msg.error || 'Document rendering worker stopped with an unknown error'))
        return
      }

      if (msg.type === 'result') {
        debug('Document HTML rendered, %d bytes', msg.html.length)
        resolve(msg.html)
      }
    })
    worker.on('error', (err) => {
      debug('Worker errored: %s', err.message)
      reject(err)
    })
    worker.on('exit', (code) => {
      if (code !== 0) {
        debug('Worker stopped with code %d', code)
        reject(new Error(`Document rendering worker stopped with exit code ${code}`))
      }
    })
  })
}

export function decorateIndexWithAutoGeneratedWarning(template: string): string {
  return template.replace(/<head/, `\n<!--\n${autoGeneratedWarning}\n-->\n<head`)
}

export function getPossibleDocumentComponentLocations(studioRootPath: string): string[] {
  return [path.join(studioRootPath, '_document.js'), path.join(studioRootPath, '_document.tsx')]
}

/**
 * Adds a base path to a URL if necessary, and returns the resulting URL.
 * @param url - The URL to prefix with a base path.
 * @param basePath - The base path to prefix the URL with. Default value is `/`.
 * @returns The resulting URL with the base path.
 * @internal
 */
export function _prefixUrlWithBasePath(url: string, basePath: string): string {
  // Normalize basePath by adding a leading slash if it's missing.
  const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`

  // If the URL starts with a slash, append it to the basePath, removing any trailing slash if present.
  if (url.startsWith('/')) {
    if (normalizedBasePath.endsWith('/')) {
      return `${normalizedBasePath.slice(0, -1)}${url}`
    }
    return `${normalizedBasePath}${url}`
  }

  // If the URL doesn't start with a slash, append it to the basePath with a slash in between.
  if (normalizedBasePath.endsWith('/')) {
    return `${normalizedBasePath}${url}`
  }
  return `${normalizedBasePath}/${url}`
}

if (!isMainThread && parentPort) {
  renderDocumentFromWorkerData()
}

function renderDocumentFromWorkerData() {
  if (!parentPort || !workerData) {
    throw new Error('Must be used as a Worker with a valid options object in worker data')
  }

  const {monorepo, studioRootPath, props, importMap}: RenderDocumentOptions = workerData || {}

  if (workerData?.dev) {
    // Define `__DEV__` in the worker thread as well
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).__DEV__ = true
  }

  if (typeof studioRootPath !== 'string') {
    parentPort.postMessage({type: 'error', message: 'Missing/invalid `studioRootPath` option'})
    return
  }

  if (props && typeof props !== 'object') {
    parentPort.postMessage({type: 'error', message: '`props` must be an object if provided'})
    return
  }

  // Require hook #1
  // Alias monorepo modules
  debug('Registering potential aliases')
  require('module-alias').addAliases(getAliases({monorepo}))

  // Require hook #2
  // Use `esbuild` to allow JSX/TypeScript and modern JS features
  debug('Registering esbuild for node %s', process.version)
  const {unregister} = __DEV__
    ? {unregister: () => undefined}
    : require('esbuild-register/dist/node').register({
        target: `node${process.version.slice(1)}`,
        jsx: 'automatic',
        extensions: ['.jsx', '.ts', '.tsx', '.mjs'],
      })

  // Require hook #3
  // Same as above, but we don't want to enforce a .jsx extension for anything with JSX
  debug('Registering esbuild for .js files using jsx loader')
  const {unregister: unregisterJs} = __DEV__
    ? {unregister: () => undefined}
    : require('esbuild-register/dist/node').register({
        target: `node${process.version.slice(1)}`,
        extensions: ['.js'],
        jsx: 'automatic',
        loader: 'jsx',
      })

  const html = getDocumentHtml(studioRootPath, props, importMap)

  parentPort.postMessage({type: 'result', html})

  // Be polite and clean up after esbuild-register
  unregister()
  unregisterJs()
}

function getDocumentHtml(
  studioRootPath: string,
  props?: DocumentProps,
  importMap?: {imports?: Record<string, string>},
): string {
  const Document = getDocumentComponent(studioRootPath)

  // NOTE: Validate the list of CSS paths so implementers of `_document.tsx` don't have to
  // - If the path is not a full URL, check if it starts with `/`
  //   - If not, then prepend a `/` to the string
  const css = props?.css?.map((url) => {
    try {
      // If the URL is absolute, we don't need to prefix it
      return new URL(url).toString()
    } catch {
      return _prefixUrlWithBasePath(url, props.basePath)
    }
  })

  debug('Rendering document component using React')
  const result = addTimestampedImportMapScriptToHtml(
    renderToStaticMarkup(createElement(Document, {...defaultProps, ...props, css})),
    importMap,
  )

  return `<!DOCTYPE html>${result}`
}

/**
 * @internal
 */
export function addTimestampedImportMapScriptToHtml(
  html: string,
  importMap?: {imports?: Record<string, string>},
): string {
  if (!importMap) return html

  let root = parseHtml(html)
  let htmlEl = root.querySelector('html')
  if (!htmlEl) {
    const oldRoot = root
    root = parseHtml('<html></html>')
    htmlEl = root.querySelector('html')!
    htmlEl.appendChild(oldRoot)
  }

  let headEl = htmlEl.querySelector('head')

  if (!headEl) {
    htmlEl.insertAdjacentHTML('afterbegin', '<head></head>')
    headEl = root.querySelector('head')!
  }

  headEl.insertAdjacentHTML(
    'beforeend',
    `<script type="application/json" id="__imports">${JSON.stringify(importMap)}</script>`,
  )
  headEl.insertAdjacentHTML('beforeend', TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT)
  return root.outerHTML
}

function getDocumentComponent(studioRootPath: string) {
  debug('Loading default document component from `sanity` module')
  const {DefaultDocument} = __DEV__
    ? require('../../../core/components/DefaultDocument')
    : require('sanity')

  debug('Attempting to load user-defined document component from %s', studioRootPath)
  const userDefined = tryLoadDocumentComponent(studioRootPath)

  if (!userDefined) {
    debug('Using default document component')
    return DefaultDocument
  }

  debug('Found user defined document component at %s', userDefined.path)

  const DocumentComp = userDefined.component.default || userDefined.component // CommonJS
  if (typeof DocumentComp === 'function') {
    debug('User defined document component is a function, assuming valid')
    return DocumentComp
  }

  debug('User defined document component did not have a default export')
  const userExports = Object.keys(userDefined.component).join(', ') || 'None'
  const relativePath = path.relative(process.cwd(), userDefined.path)
  const typeHint =
    typeof userDefined.component.default === 'undefined'
      ? ''
      : ` (type was ${typeof userDefined.component.default})`

  const warnKey = `${relativePath}/${userDefined.modified}`

  parentPort?.postMessage({
    type: 'warning',
    message: [
      `${relativePath} did not have a default export that is a React component${typeHint}`,
      `Named exports/properties found: ${userExports}`.trim(),
      `Using default document component from "sanity".`,
    ],
    warnKey,
  })

  return DefaultDocument
}

function tryLoadDocumentComponent(studioRootPath: string) {
  const locations = getPossibleDocumentComponentLocations(studioRootPath)

  for (const componentPath of locations) {
    debug('Trying to load document component from %s', componentPath)
    try {
      return {
        // eslint-disable-next-line import/no-dynamic-require
        component: importFresh<any>(componentPath),
        path: componentPath,
        // eslint-disable-next-line no-sync
        modified: Math.floor(fs.statSync(componentPath)?.mtimeMs),
      }
    } catch (err) {
      // Allow "not found" errors
      if (err.code !== 'MODULE_NOT_FOUND') {
        debug('Failed to load document component: %s', err.message)
        throw err
      }

      debug('Document component not found at %s', componentPath)
    }
  }

  return null
}
