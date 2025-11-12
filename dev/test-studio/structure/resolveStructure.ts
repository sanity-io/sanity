import {type StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) => {
  return S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('author').title('Authors'),
      S.documentTypeListItem('book').title('Books'),
    ])
}
