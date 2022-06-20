// /deskStructure.js
import S from '@sanity/desk-tool/structure-builder'
import {CogIcon as SettingsIcon} from '@sanity/icons'
import {getDocumentNodeWithViews} from './plugins/views-in-schema/documentNodeWithViews'

export const getDefaultDocumentNode = getDocumentNodeWithViews
const excludedDocumentTypes = ['siteSettings', 'media.tag', 'link']

export default () =>
  S.list()
    .title('Content')
    .items([
      S.documentListItem()
        .title('Settings')
        .id('siteSettings')
        .schemaType('siteSettings')
        .icon(SettingsIcon),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (listItem) => !excludedDocumentTypes.includes(listItem.getId())
      ),
      S.divider(),
      S.documentTypeListItem('link').title('Links').id('links'),
    ])
