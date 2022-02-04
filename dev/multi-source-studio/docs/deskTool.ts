import {deskTool} from '@sanity/desk-tool'
import {DocumentsIcon} from '@sanity/icons'

export const docsDeskTool = deskTool({
  source: 'docs',
  name: 'docs',
  title: 'Docs',

  structure: (S) =>
    S.list()
      .source('docs')
      .id('docs')
      .title('Docs')
      .items([
        S.listItem()
          .id('articles')
          .title('Articles (source=docs)')
          .icon(DocumentsIcon)
          .child(
            S.documentList()
              .source('docs')
              .id('articles')
              .schemaType('article')
              .filter(`_type == $type`)
              .params({type: 'article'})
              .title('Articles')
          ),
        S.listItem()
          .id('blog-posts')
          .title('Blog posts (source=blog)')
          .icon(DocumentsIcon)
          .child(
            S.documentList()
              .source('blog')
              .id('posts')
              .schemaType('post')
              .filter(`_type == $type`)
              .params({type: 'post'})
              .title('Posts')
          ),
      ]),
})
