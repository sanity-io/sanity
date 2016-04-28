import test from 'ava'
import joinQueries from '../src/joinQueries'

test('can join simple queries', t => {
  const query = joinQueries({
    foo: 'items.foo',
    bar: 'items.bar[.$id == :something]'
  })

  t.is(query, '{\n  "foo": items.foo,\n  "bar": items.bar[.$id == :something]\n}')
})
