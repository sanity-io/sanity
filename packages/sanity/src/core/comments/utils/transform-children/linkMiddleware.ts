import {createElement, type ReactNode} from 'react'

import {type Middleware} from './types'

const URL_REGEX = /\b(https?:\/\/[^\s,()]+(?:\.[^\s,()]+)*|www\.[^\s,()]+\.[^\s,()]{2,})\b/g

function createLinkElement(url: string): ReactNode {
  const href = url.startsWith('http') ? url : `https://${url}`

  return createElement('a', {href, target: '_blank', rel: 'noopener noreferrer', key: url}, url)
}

/**
 * Middleware that creates link elements for URLs in the text
 */
export const linkMiddleware: Middleware = (node) => {
  if (typeof node === 'string') {
    const parts = node.split(URL_REGEX)

    return parts.flatMap((part) => {
      if (part.match(URL_REGEX)) {
        return createLinkElement(part)
      }

      return part
    })
  }

  return node
}
