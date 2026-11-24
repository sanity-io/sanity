import {renderMessage} from './groqLint'

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  content?: string | Node,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (content !== undefined) node.append(content)
  return node
}

export interface DocParts {
  code: string
  description?: string
  notes?: string[]
  link?: {href: string; text: string}
}

/**
 * The editor's documentation for what the pointer is on: a signature, declaration or type, then
 * what it does and how to use it
 */
export function renderDoc(parts: DocParts): HTMLElement {
  const dom = element('div', 'cm-vision-function-doc')
  dom.append(element('pre', 'cm-vision-function-code', parts.code))
  if (parts.description) {
    dom.append(element('p', 'cm-vision-function-description', renderMessage(parts.description)))
  }
  for (const note of parts.notes ?? []) {
    dom.append(element('p', 'cm-vision-function-note', renderMessage(note)))
  }
  if (parts.link) {
    const link = element('a', 'cm-vision-function-link', parts.link.text)
    link.href = parts.link.href
    link.target = '_blank'
    link.rel = 'noreferrer'
    dom.append(link)
  }
  return dom
}
