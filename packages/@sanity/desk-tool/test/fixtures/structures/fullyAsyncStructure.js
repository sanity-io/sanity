import {of, merge, throwError} from 'rxjs'
import {delay} from 'rxjs/operators'

export default ({errorAt} = {}) =>
  Promise.resolve({
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
            const result =
              itemId === '404'
                ? undefined
                : {
                    type: 'document',
                    options: {id: itemId, type: parent.options.params.type},
                  }

            return errorAt === 2
              ? throwError(new Error(`Failed to load at ${errorAt}`))
              : merge(of(result).pipe(delay(25)), of(result).pipe(delay(50)))
          },
        },
      })),
    },
    resolveChildForItem(itemId, parent) {
      const target = parent.options.items.find((item) => item.id === itemId)
      return new Promise((resolve, reject) =>
        errorAt === 1
          ? setTimeout(reject, 25, new Error(`Failed to load at ${errorAt}`))
          : setTimeout(resolve, 25, target && target.child)
      )
    },
  })
