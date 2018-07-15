import promiseReduce from './promiseReduce'

export default function resolvePanes(struct, ids) {
  const structure = struct && typeof struct.serialize === 'function' ? struct.serialize() : struct
  if (!structure) {
    // @todo add help url link, log to console?
    return Promise.reject(new Error('Structure not defined or invalid'))
  }

  const paneIds = [structure.id].concat(ids).filter(Boolean)
  return promiseReduce(
    paneIds,
    (panes, id, index) => {
      if (index === 0) {
        return Promise.all([structure])
      }

      const parent = panes[index - 1]
      if (!parent || typeof parent.resolveChildForItem !== 'function') {
        return panes
      }

      const child = parent.resolveChildForItem(id, parent, {index})
      return Promise.resolve(child).then(pane => (pane ? [...panes, pane] : panes))
    },
    []
  )
}
