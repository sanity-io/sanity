import {StructureBuilder as S} from '../src'

test('throws on missing id', () => {
  expect(() => S.view.component().serialize()).toThrowError(/`id` is required/)
})

test('throws on missing title', () => {
  expect(() => S.view.component().id('foo').serialize()).toThrowError(/`title` is required/)
})

test('throws on invalid id', () => {
  expect(() => S.view.component().id('foo bar').title('Foo bar').serialize()).toThrowError(
    'Structure node id cannot contain character " "'
  )
})

test('infers id from title if not set', () => {
  expect(S.view.component().title('Foo bar').getId()).toEqual('foo-bar')
})

test('does not infer id from title if already set', () => {
  expect(S.view.component().id('default-thing').title('Foo bar').getId()).toEqual('default-thing')
})

test('builds component view through component constructor', () => {
  expect(
    S.view
      .component(() => null)
      .id('custom')
      .title('Custom')
      .options({foo: 'bar'})
      .serialize()
  ).toMatchSnapshot()
})

test('can override component set through constructor', () => {
  const original = () => null
  const changed = () => null
  const builder = S.view.component(original).id('custom').title('Custom').component(changed)

  expect(builder.serialize()).toMatchSnapshot()
  expect(builder.getComponent()).toBe(changed)
})

test('builder is immutable', () => {
  const original = S.view.component()
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.icon(() => null)).not.toBe(original)
  expect(original.options({})).not.toBe(original)
  expect(original.component(() => null)).not.toBe(original)
})

test('getters work', () => {
  const original = S.view.component()
  const icon = () => null
  const component = () => null
  const options = {foo: 'bar'}

  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('title').getTitle()).toEqual('title')
  expect(original.icon(icon).getIcon()).toEqual(icon)
  expect(original.options(options).getOptions()).toEqual(options)
  expect(original.component(component).getComponent()).toEqual(component)
})
