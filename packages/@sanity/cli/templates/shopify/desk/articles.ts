import S from '@sanity/desk-tool/structure-builder'
import {DocumentsIcon} from '@sanity/icons'

// prettier-ignore
export const articles = S.listItem()
  .title('Articles')
  .icon(DocumentsIcon)
  .child(
    S.list()
      .title('Articles')
      .items([
        S.listItem()
          .title('Editorial')
          .schemaType('article.editorial')
          .child(
            S.documentTypeList('article.editorial')
          ),
        S.listItem()
          .title('Info')
          .schemaType('article.info')
          .child(
            S.documentTypeList('article.info')
          ),
      ])
  )
