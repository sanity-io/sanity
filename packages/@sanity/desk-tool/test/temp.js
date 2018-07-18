const {of, merge} = require('rxjs')
const {mapTo, delay} = require('rxjs/operators')
const resolvePanes = require('../src/utils/resolvePanes.new')
const typeDocumentStructure = {
  id: '__root__',
  title: 'Content',
  type: 'list',
  options: {
    items: ['book', 'author'].map(id => ({
      id,
      title: id.slice(0, 1).toUpperCase() + id.slice(1),
      child: {
        type: 'documentList',
        options: {
          filter: '_type == $type',
          params: {type: id}
        },
        resolveChildForItem(itemId, parent) {
          const result =
            itemId === '404'
              ? undefined
              : {
                  type: 'document',
                  options: {id: itemId, type: parent.options.params.type}
                }
          return merge(of(result).pipe(delay(25)), of(result).pipe(delay(50)))
        }
      }
    }))
  },
  resolveChildForItem(itemId, parent) {
    const target = parent.options.items.find(item => item.id === itemId)
    return new Promise(resolve => setTimeout(resolve, 25, target && target.child))
  }
}

let last = Date.now()
const sub = resolvePanes(typeDocumentStructure, ['book', 'got']).subscribe(
  val => {
    console.log('')
    console.log('%d ms', Date.now() - last)
    console.log(require('util').inspect(val, {colors: true}))
    last = Date.now()
  },
  err => {
    console.error('error', err)
  },
  () => {
    console.log('complete')
  }
)

//setTimeout(() => sub.unsubscribe(), 100)
