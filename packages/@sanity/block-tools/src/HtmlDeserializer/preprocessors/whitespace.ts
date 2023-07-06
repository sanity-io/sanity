import {PRESERVE_WHITESPACE_TAGS} from '../../constants'
import {_XPathResult} from './xpathResult'

export default (_: string, doc: Document): Document => {
  // Recursively process all nodes.
  function processNode(node: Node) {
    // If this is a text node and not inside a tag where whitespace should be preserved, process it.
    if (
      node.nodeType === _XPathResult.BOOLEAN_TYPE &&
      !PRESERVE_WHITESPACE_TAGS.includes(node.parentElement?.tagName.toLowerCase() || '')
    ) {
      node.textContent =
        node.textContent
          ?.replace(/\s\s+/g, ' ') // Remove multiple whitespace
          .replace(/[\r\n]+/g, ' ') || '' // Replace newlines with spaces
    }
    // Otherwise, if this node has children, process them.
    else {
      for (let i = 0; i < node.childNodes.length; i++) {
        processNode(node.childNodes[i])
      }
    }
  }

  // Process all nodes starting from the root.
  processNode(doc.body)

  return doc
}
