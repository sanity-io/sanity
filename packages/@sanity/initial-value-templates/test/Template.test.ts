import {TemplateBuilder as T} from '../src'

const icon = () => null

describe('T.template()', () => {
  test('builds template through constructor', () => {
    expect(
      T.template({
        id: 'foo',
        title: 'some title',
        schemaType: 'author',
        value: {name: 'Default name!'},
        icon,
      }).serialize()
    ).toMatchSnapshot()
  })

  test('throws on missing id', () => {
    expect(() => T.template().serialize()).toThrowError(/required "id"/)
  })

  test('throws on missing title', () => {
    expect(() => T.template().id('id').serialize()).toThrowError(/required "title"/)
  })

  test('throws on missing schemaType', () => {
    expect(() => T.template().id('id').title('Blah').serialize()).toThrowError(
      /required "schemaType"/
    )
  })

  test('throws on missing value', () => {
    expect(() => T.template().id('id').title('Blah').schemaType('author').serialize()).toThrowError(
      /required "value"/
    )
  })

  test('can construct using builder', () => {
    expect(
      T.template()
        .id('yeah')
        .title('Yeah')
        .schemaType('author')
        .icon(icon)
        .value({name: 'bar'})
        .serialize()
    ).toMatchSnapshot()
  })

  test('builder is immutable', () => {
    const original = T.template()
    expect(original.id('foo')).not.toEqual(original)
    expect(original.title('foo')).not.toEqual(original)
    expect(original.schemaType('author')).not.toEqual(original)
    expect(original.icon(icon)).not.toEqual(original)
    expect(original.value({name: 'foo'})).not.toEqual(original)
  })

  test('getters work', () => {
    const original = T.template()
    expect(original.id('foo').getId()).toEqual('foo')
    expect(original.title('bar').getTitle()).toEqual('bar')
    expect(original.schemaType('author').getSchemaType()).toEqual('author')
    expect(original.icon(icon).getIcon()).toEqual(icon)
    expect(original.value({name: 'bar'}).getValue()).toEqual({name: 'bar'})
  })
})

describe('T.defaultTemplateForType()', () => {
  test('generates correct representation of type without initial value', () => {
    expect(T.defaultTemplateForType('author').serialize()).toMatchSnapshot()
  })

  test('generates correct representation of type with initial value', () => {
    expect(T.defaultTemplateForType('post').serialize()).toMatchSnapshot()
  })
})

describe('T.defaults()', () => {
  test('generates array of all schema type templates', () => {
    expect(T.defaults()).toMatchSnapshot()
    expect(T.defaults().map((tpl) => tpl.serialize())).toMatchSnapshot()
  })
})
