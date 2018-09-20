import Structure from '../structure-builder'

export default () =>
  Structure.list()
    .id('__root__')
    .title('Content')
    .items(Structure.documentTypeListItems())
