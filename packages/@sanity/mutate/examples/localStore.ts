import {
  at,
  createIfNotExists,
  createOrReplace,
  del,
  patch,
  set,
  setIfMissing,
} from '@sanity/mutate'
import {createStore} from '@sanity/mutate/_unstable_apply'

const localStore = createStore([{_id: 'hello', _type: 'hello'}])
console.log('initial', localStore.get('hello'))

localStore.apply(
  createOrReplace({_id: 'hello', _type: 'hello', replaced: true}),
)
console.log('after createOrReplace', localStore.get('hello'))

localStore.apply(patch('hello', at('some', setIfMissing({}))))
localStore.apply(patch('hello', at('some.nested', setIfMissing({}))))
localStore.apply(patch('hello', at('some.nested.field', set('hi!'))))

console.log('after set nested field', localStore.get('hello'))

localStore.apply([
  createIfNotExists({_id: 'new', _type: 'newDoc'}),
  patch('hello', at('blabla', set('hei hei'))),
])

localStore.apply([
  createIfNotExists({_id: 'blog-post-1', _type: 'blogpost'}),
  createIfNotExists({_id: 'drafts.blog-post-1', _type: 'blogpost'}),
])

localStore.apply([
  patch('drafts.blog-post-1', at('title', set('ready'))),
  patch('drafts.blog-post-1', at('title', set('ready for'))),
  patch('drafts.blog-post-1', at('title', set('ready for publishing'))),
])

const doc = localStore.get('drafts.blog-post-1')

if (doc) {
  localStore.apply([createOrReplace(doc), del('drafts.blog-post-1')])
}
console.log('---all documents---')
for (const [id, document] of localStore.entries()) {
  console.log(document)
}
