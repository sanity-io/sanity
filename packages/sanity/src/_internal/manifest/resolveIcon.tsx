import DOMPurify from 'isomorphic-dompurify'
import {renderToString} from 'react-dom/server'

import {SchemaIcon, type SchemaIconProps} from './Icon'
import {config} from './purifyConfig'

export type {SchemaIconProps}

export const resolveIcon = (props: SchemaIconProps): string | null => {
  try {
    const html = renderToString(<SchemaIcon {...props} />)
    return DOMPurify.sanitize(html.trim(), config)
  } catch {
    return null
  }
}
