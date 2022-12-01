import {ListItemBuilder} from 'sanity/desk'
import defineStructure from '../utils/defineStructure'

export default defineStructure<ListItemBuilder>((S) =>
  S.listItem().title('Collections').schemaType('collection').child(S.documentTypeList('collection'))
)
