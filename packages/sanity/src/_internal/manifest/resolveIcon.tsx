import type DOMPurifyType from 'isomorphic-dompurify'
import {renderToString} from 'react-dom/server'

import {SchemaIcon, type SchemaIconProps} from './Icon'
import {config} from './purifyConfig'

export type {SchemaIconProps}

export interface ResolveIconOptions extends SchemaIconProps {
  /**
   * When true, sanitize the rendered HTML with DOMPurify.
   * Required when the output is written to a file. Can be skipped
   * when the output is posted to an API that sanitizes server-side.
   */
  sanitize?: boolean
}

let cachedDOMPurify: typeof DOMPurifyType | undefined

async function getDOMPurify() {
  if (!cachedDOMPurify) {
    const mod = await import('isomorphic-dompurify')
    cachedDOMPurify = mod.default
  }
  return cachedDOMPurify
}

export async function resolveIcon(options: ResolveIconOptions): Promise<string | undefined> {
  try {
    const html = renderToString(<SchemaIcon {...options} />).trim()
    if (!options.sanitize) return html || undefined
    const DOMPurify = await getDOMPurify()
    return DOMPurify.sanitize(html, config)
  } catch {
    return undefined
  }
}
