import promiseReduce from './promiseReduce'

export default function derivePanesFromRouterState(structure, state) {
  const paneIds = [structure.id].concat(state.panes).filter(Boolean)
  return promiseReduce(
    paneIds,
    (panes, id, index) => {
      if (index === 0) {
        return Promise.all([structure])
      }

      const parent = panes[index - 1]
      if (typeof parent.child === 'undefined') {
        return panes
      }

      const parentItem = typeof parent.getItem === 'function' ? parent.getItem(id) : id
      return Promise.resolve(parentItem)
        .then(item => {
          return typeof parent.child === 'function'
            ? parent.child({id, item, parent, index})
            : parent.child
        })
        .then(child => panes.concat(child))
    },
    []
  )
}
