export default {
  id: '__root__',
  title: 'Configuration',
  type: 'list',
  options: {
    items: ['a', 'b', 'c'].map(id => ({
      id,
      title: id.toUpperCase(),
      child: {
        type: 'document',
        options: {id, type: 'someType'}
      }
    }))
  },
  resolveChildForItem(itemId, parent) {
    const target = parent.options.items.find(item => item.id === itemId)
    return target && target.child
  }
}
