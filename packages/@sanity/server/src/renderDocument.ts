/**
 * Looks for and imports (in preferred order):
 *   - src/_document.js
 *   - src/_document.tsx
 *
 * Then renders using ReactDOM to a string, which is sent back to the parent
 * process over the worker `postMessage` channel.
 */
import path from 'path'
import {Worker, parentPort, workerData, isMainThread} from 'worker_threads'
import {createElement} from 'react'
import {renderToString} from 'react-dom/server'
import {Document as DefaultDocument} from '@sanity/base'
import {register} from 'esbuild-register/dist/node'

const defaultProps = {
  entryPath: '/$SANITY_STUDIO_ENTRY$',
}

export function renderDocument(options: {
  studioRootPath: string
  props?: {entryPath?: string}
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: options,
    })
    worker.on('message', (msg) => {
      if (msg.type === 'warn') {
        console.warn(msg.message)
        return
      }

      if (msg.type === 'error') {
        reject(new Error(msg.error || 'Document rendering worker stopped with an unknown error'))
        return
      }

      if (msg.type === 'result') {
        resolve(msg.html)
      }
    })
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Document rendering worker stopped with exit code ${code}`))
      }
    })
  })
}

if (!isMainThread) {
  renderDocumentFromWorkerData()
}

function renderDocumentFromWorkerData() {
  if (!parentPort || !workerData) {
    throw new Error('Must be used as a Worker with a valid options object in worker data')
  }

  const studioRootPath = workerData.studioRootPath
  const props = workerData.props

  if (typeof studioRootPath !== 'string') {
    parentPort.postMessage({type: 'error', message: 'Missing/invalid `studioRootPath` option'})
    return
  }

  if (props && typeof props !== 'object') {
    parentPort.postMessage({type: 'error', message: '`props` must be an object if provided'})
    return
  }

  register({
    target: `node${process.version.slice(1)}`,
  })

  const Document = getDocumentComponent(studioRootPath)
  const result = renderToString(createElement(Document, {...defaultProps, ...props}))
  const html = `<!DOCTYPE html>${result}`

  parentPort.postMessage({type: 'result', html})
}

function getDocumentComponent(studioRootPath: string) {
  const userDefined = tryLoadDocumentComponent(studioRootPath)

  if (userDefined) {
    const DocumentComp = userDefined.component.default || userDefined.component
    if (typeof DocumentComp === 'function') {
      return DocumentComp
    }

    parentPort?.postMessage({
      type: 'warning',
      message: `Component at ${userDefined.path} did not have a default export that is a React component, using default document component from "@sanity/base"`,
    })
  }

  return DefaultDocument
}

function tryLoadDocumentComponent(studioRootPath: string) {
  try {
    const componentPath = path.join(studioRootPath, 'src', '_document.js')
    return {
      // eslint-disable-next-line import/no-dynamic-require
      component: require(componentPath),
      path: componentPath,
    }
  } catch (err) {
    // Allow this to fail
  }

  try {
    const componentPath = path.join(studioRootPath, 'src', '_document.tsx')
    return {
      // eslint-disable-next-line import/no-dynamic-require
      component: require(componentPath),
      path: componentPath,
    }
  } catch (err) {
    // Allow this to fail
  }

  return null
}
