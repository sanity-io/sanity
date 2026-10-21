import {type StructureResolver} from 'sanity/structure'

const TYPES = ['book', 'bookLive', 'author', 'publisher', 'series', 'place']
/** The translated copies of the seed data are not part of the open beta (no localization plugin), so only the English documents are listed. */
const ENGLISH_ONLY = '_type == $type && (!defined(language) || language == "en")'

/** The Content list: the Nordic Books types only, in the Studio's own list items. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items(
      S.documentTypeListItems()
        .filter((item) => TYPES.includes(item.getId() ?? ''))
        .map((item) => {
          const id = item.getId() as string
          const title = item.getTitle() ?? id
          return S.listItem()
            .id(id)
            .title(title)
            .icon(item.getIcon())
            .child(S.documentTypeList(id).title(title).filter(ENGLISH_ONLY).params({type: id}))
        }),
    )
