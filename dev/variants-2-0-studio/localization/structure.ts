import {type StructureResolver} from 'sanity/structure'

import {documentLevelOn, FIELD_LEVEL_TYPES, fieldLevelOn, LOCALIZED_TYPES} from './plugin'

// The Content list, as the stock one (every document type), with one difference: the translated documents are only listed while the
// localization plugin is switched on (`localization` B or D); the field-level book type is listed with C or D. With the plugin off a list is what it always was (English documents only) and the
// plugin's metadata type is not listed. Read when the list opens, so a change of the switch shows on the next open of the list.
const ENGLISH_ONLY = '_type == $type && (!defined(language) || language == "en")'

export const structure: StructureResolver = (S) => {
  const documentLevel = documentLevelOn()
  const fieldLevel = fieldLevelOn()
  const items = S.documentTypeListItems().flatMap((item) => {
    const id = item.getId()
    if (id === 'translation.metadata') return documentLevel ? [item] : []
    if (id && FIELD_LEVEL_TYPES.includes(id)) return fieldLevel ? [item] : []
    if (documentLevel || !id || !LOCALIZED_TYPES.includes(id)) return [item]
    const title = item.getTitle() ?? id
    return [
      S.listItem()
        .id(id)
        .title(title)
        .icon(item.getIcon())
        .child(S.documentTypeList(id).title(title).filter(ENGLISH_ONLY).params({type: id})),
    ]
  })
  return S.list().title('Content').items(items)
}
