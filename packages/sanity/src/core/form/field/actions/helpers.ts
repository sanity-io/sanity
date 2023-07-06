import {DocumentFieldActionNode} from '../../../config'

export function filterActions(actions: DocumentFieldActionNode[]): DocumentFieldActionNode[] {
  return actions
    .filter(Boolean)
    .filter((node) => {
      if ('hidden' in node) return node.hidden !== true
      return true
    })
    .map((node) => {
      if (node.type === 'group') {
        return {
          ...node,
          children: filterActions(node.children),
        }
      }

      return node
    })
}
