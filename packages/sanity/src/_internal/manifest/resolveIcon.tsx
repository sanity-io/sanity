import type DOMPurifyType from 'isomorphic-dompurify'
import {renderToString} from 'react-dom/server'

import {SchemaIcon, type SchemaIconProps} from './Icon'
import {config} from './purifyConfig'

export type {SchemaIconProps}

let cachedDOMPurify: typeof DOMPurifyType | undefined

async function getDOMPurify() {
  if (!cachedDOMPurify) {
    const mod = await import('isomorphic-dompurify')
    cachedDOMPurify = mod.default
  }
  return cachedDOMPurify
}

export const resolveIcon = async (props: SchemaIconProps): Promise<string | undefined> => {
  try {
    const html = renderToString(<SchemaIcon {...props} />)
    const DOMPurify = await getDOMPurify()
    return DOMPurify.sanitize(html.trim(), config)
  } catch {
    return undefined
  }
}
