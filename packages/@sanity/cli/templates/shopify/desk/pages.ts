import S from '@sanity/desk-tool/structure-builder'

// prettier-ignore
export const pages = S.listItem()
  .title('Pages')
  .schemaType('page')
  .child(
    S.documentTypeList('page')
      .defaultOrdering([{ field: 'title', direction: 'asc'}])
  )
