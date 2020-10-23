export default {
  id: '__root__',
  title: 'Content',
  type: 'list',
  options: {
    items: ['book', 'author'].map((id) => ({
      id,
      title: id.slice(0, 1).toUpperCase() + id.slice(1),
      child: {
        type: 'documentList',
        options: {
          filter: '_type == $type',
          params: {type: id},
        },
        resolveChildForItem(itemId, parent) {
          return itemId === '404'
            ? undefined
            : {
                type: 'document',
                options: {id: itemId, type: parent.options.params.type},
              }
        },
      },
    })),
  },
  resolveChildForItem(itemId, parent) {
    const target = parent.options.items.find((item) => item.id === itemId)
    return target && target.child
  },
}
