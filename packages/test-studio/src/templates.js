import {createProgressEvent} from '@sanity/base/initial-value-templates'
import T from '@sanity/base/initial-value-template-builder'
import {of, from, concat} from 'rxjs'
import {delay, concatMap} from 'rxjs/operators'

export default [
  ...T.defaults(),

  T.template({
    id: 'author-developer',
    title: 'Developer',
    description: `Selects the role "Developer" for you, so you don't have to`,
    schemaType: 'author',
    value: params => ({role: 'developer'})
  }),

  T.template({
    id: 'book-by-author',
    title: 'Book by author',
    description: 'Book by a specific author',
    schemaType: 'book',
    parameters: [{name: 'authorId', type: 'string'}],
    value: params => ({
      author: {_type: 'reference', _ref: params.authorId}
    })
  }),

  T.template({
    id: 'slow-color-promise',
    title: 'Slow color (promise)',
    schemaType: 'colorTest',
    value: () => new Promise(resolve => setTimeout(resolve, 5000, {title: 'Really slow color!'}))
  }),

  T.template({
    id: 'slow-color-observable',
    title: 'Slow color (observable)',
    schemaType: 'colorTest',
    value: () =>
      concat(
        from([5, 4, 3, 2, 1, 0]).pipe(
          concatMap(num => of(createProgressEvent(`Resolving in... ${num}`)).pipe(delay(1000)))
        ),
        of({title: 'Wow, that took a while.'})
      )
  })
]
