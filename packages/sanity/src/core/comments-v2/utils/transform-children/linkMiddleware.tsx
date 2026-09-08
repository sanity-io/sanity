import {type MouseEvent, type ReactNode} from 'react'

import {type Middleware} from './types'

const URL_REGEX = /\b(https?:\/\/[^\s,()]+(?:\.[^\s,()]+)*|www\.[^\s,()]+\.[^\s,()]{2,})\b/g

export function onClick(event: MouseEvent<HTMLAnchorElement>): void {
  event.stopPropagation()
}

function createLinkElement(url: string): ReactNode {
  const href = url.startsWith('http') ? url : `https://${url}`

  return (
    <a key={url} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      {url}
    </a>
  )
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
