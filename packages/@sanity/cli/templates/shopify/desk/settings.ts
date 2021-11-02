import S from '@sanity/desk-tool/structure-builder'

// prettier-ignore
export const settings = S.listItem()
  .title('Settings')
  .schemaType('settings')
  .child(
    S.editor()
      .title('Settings')
      .schemaType('settings')
      .documentId('settings')
  )
