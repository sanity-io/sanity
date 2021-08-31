import Mutation from '../src/document/Mutation'

test('updates _updatedAt when there is a timestamp', () => {
  const timestamp = '2017-05-02T11:56:00.643Z'
  const mutation = new Mutation({
    mutations: [{patch: {id: '1', set: {value: 'banana'}}}],
    timestamp,
  })
  const doc = mutation.apply({_id: '1', _type: 'test'})
  expect(doc._updatedAt).toBe(timestamp)
})

test('does not update _updatedAt when there is no timestamp', () => {
  const timestamp = '2017-05-02T11:56:00.643Z'
  const mutation = new Mutation({
    mutations: [{patch: {id: '1', set: {value: 'banana'}}}],
  })
  const doc = mutation.apply({_id: '1', _type: 'test', _updatedAt: timestamp})
  expect(doc._updatedAt).toBe(timestamp)
})
