import Structure from '../structure-builder'

export default () => {
  const items = Structure.documentTypeListItems()
  return Structure.list()
    .id('__root__')
    .title('Content')
    .showIcons(items.some(item => item.getSchemaType().icon))
    .items(items)
}
