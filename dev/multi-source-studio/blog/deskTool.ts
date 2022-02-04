import {deskTool} from '@sanity/desk-tool'
import {DocumentsIcon} from '@sanity/icons'

export const blogDeskTool = deskTool({
  source: 'blog',
  name: 'blog',
  title: 'Blog',

  structure: (S) =>
    S.list()
      .id('blog')
      .title('Blog')
      .items([
        S.listItem()
          .icon(DocumentsIcon)
          .id('posts')
          .title('Posts')
          .child(
            S.documentList()
              .schemaType('post')
              .id('posts')
              .title('Posts')
              .filter(`_type == $type`)
              .params({type: 'post'})
          ),
        S.listItem()
          .id('tags')
          .title('Tags')
          .child(
            S.documentList()
              .schemaType('tag')
              .id('tags')
              .title('Tags')
              .filter(`_type == $type`)
              .params({type: 'tag'})
          ),
      ]),
})
