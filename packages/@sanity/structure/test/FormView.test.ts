import {StructureBuilder as S} from '../src'

test('builds form view through constructor, with defaults', () => {
  expect(S.view.form().serialize()).toMatchSnapshot()
})

test('can override defaults', () => {
  expect(
    S.view
      .form()
      .title('Custom editor')
      .id('custom-editor')
      .icon(() => null)
      .serialize()
  ).toMatchSnapshot()
})

test('builder is immutable', () => {
  const original = S.view.form()
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.icon(() => null)).not.toBe(original)
})

test('getters work', () => {
  const original = S.view.form()
  const icon = () => null

  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('title').getTitle()).toEqual('title')
  expect(original.icon(icon).getIcon()).toEqual(icon)
})
