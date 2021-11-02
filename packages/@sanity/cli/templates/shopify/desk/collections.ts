import S from '@sanity/desk-tool/structure-builder'

// prettier-ignore
export const collections = S.listItem()
  .title('Collections')
  .schemaType('collection')
  .child(
    S.documentTypeList('collection')
  )
