import S from '@sanity/desk-tool/structure-builder'
import {EditIcon} from '@sanity/icons'

/**
 * ## Install
 * Export this function in structure part as export const getDefaultDocumentNode to enable.
 *
 * ## Feature
 * Adds support for automatically adding views (split panes) to a document type
 * when the `views` field is set.
 *
 * This essentially extends the studio with new functionality, as we can now
 * define views directly in a schema like so:
 *
 * ```js
 * import S from "@sanity/desk-tool/structure-builder";
 * import {EditIcon} from '@sanity/icons';
 *  // provide any component you like render the view
 * import {PreviewComponent} from './PreviewComponent';
 *
 * export default myDocumentType = {
 *   type: "document",
 *   name: "my-document",
 *
 * export default myDocumentType = {
 *   type: "document",
 *   name: "my-document",
 *
 *   //we add support for this new field on all document schemas
 *   views: [
 *     S.view
 *       .component(PreviewComponent)
 *       .title('Preview')
 *       .icon(EyeOpenIcon),
 *   ],
 *
 *   fields: [
 *     // document fields as usual
 *   ]
 * }
 *
 * ```
 */
export const getDocumentNodeWithViews = ({schemaType}) => {
  // schemaType is a string: we need to get the real schema object
  // we can do that by finding the documentTypeListItem that matches the incoming schemaType
  const matchingTypes = S.documentTypeListItems()
    .filter((listItem) => listItem.spec.schemaType.name === schemaType)
    .map((listItem) => {
      // schema is the compiled Studio schema object
      const schema = listItem.spec.schemaType

      const views = schema?.views
      let viewList = views ? (Array.isArray(views) ? [...views] : [views]) : []

      // If the schema has views set, we create a default document node
      if (viewList.length) {
        viewList = [S.view.form().title('Edit').icon(EditIcon), ...viewList]
        return S.document().views(viewList)
      }
      return undefined
    })

  // If schemaType did not have views field, we return undefined: then the regular form builder view will be used as normal
  return matchingTypes.length ? matchingTypes[0] : undefined
}
