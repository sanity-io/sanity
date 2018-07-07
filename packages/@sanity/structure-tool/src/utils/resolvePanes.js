const promiseReduce = require('./promiseReduce')

module.exports = function resolvePanes(structure, ids) {
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
