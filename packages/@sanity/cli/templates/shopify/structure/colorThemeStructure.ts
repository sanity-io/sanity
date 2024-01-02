import {ListItemBuilder} from 'sanity/desk'
import defineStructure from '../utils/defineStructure'

export default defineStructure<ListItemBuilder>((S) =>
  S.listItem()
    .title('Color themes')
    .schemaType('colorTheme')
    .child(S.documentTypeList('colorTheme'))
)
