const editor = {type: 'document', options: {id: 'Singleton', type: 'whatever'}}

const listA = {
  title: 'List A',
  type: 'list',
  options: {
    items: ['List', 'Singleton'].map(id => ({id, title: id}))
  },
  resolveChildForItem: (id, parent, {index}) => {
    return new Promise(resolve => process.nextTick(resolve, id === 'List' ? listA : editor))
  }
}

export default listA
