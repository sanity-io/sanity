import {type ReleaseDocument} from '@sanity/client'
import {Label} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {memo, useContext} from 'react'
import {OtherReleasesContext} from 'sanity/_singletons'
import {IntentLink} from 'sanity/router'
import {Box, Text, VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {isCardinalityOneRelease} from '../../../../util/releaseUtils'
import {releasesLocaleNamespace} from '../../../i18n'
import {RELEASES_INTENT} from '../../../plugin'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'

/**
 * A quiet button on a release document row: the document is also in other active releases. It
 * opens a menu that names them and links to each, so the list is reachable by keyboard and screen
 * reader, not only on hover.
 *
 * @internal
 */
export const AlsoInOtherReleases = memo(function AlsoInOtherReleases({
  documentId,
  otherReleases,
}: {
  documentId: string
  otherReleases: ReleaseDocument[]
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()

  if (otherReleases.length === 0) return null

  const count = otherReleases.length

  return (
    <MenuButton
      id={`also-in-other-releases-${documentId}`}
      button={
        <Button
          mode="bleed"
          tone="default"
          text={t(count === 1 ? 'shared-documents.badge_one' : 'shared-documents.badge_other', {
            count,
          })}
          data-testid={`also-in-other-releases-${documentId}`}
        />
      }
      popover={{placement: 'bottom-start', portal: true}}
      menu={
        <Menu>
          <Box padding={3} paddingBottom={2}>
            <VStack gap={3}>
              <Label size={1}>{t('shared-documents.menu-title')}</Label>
              <Text muted size={1}>
                {t('shared-documents.menu-description')}
              </Text>
            </VStack>
          </Box>
          <MenuDivider />
          {otherReleases.map((release) => (
            <MenuItem
              key={release._id}
              as={IntentLink}
              data-as="a"
              intent={RELEASES_INTENT}
              params={{id: getReleaseIdFromReleaseDocumentId(release._id)}}
              text={
                release.metadata.title ||
                (isCardinalityOneRelease(release)
                  ? t('shared-documents.scheduled-draft')
                  : tCore('release.placeholder-untitled-release'))
              }
            />
          ))}
        </Menu>
      }
    />
  )
})

/**
 * {@link AlsoInOtherReleases} for a row's document group, read from the release page's
 * `OtherReleasesContext`. Renders nothing outside a release page. A context, not a column option,
 * so a change in the other releases re-renders these cells without rebuilding the table columns
 * (which would reset the table's sort).
 *
 * @internal
 */
export function AlsoInOtherReleasesForGroup({
  documentId,
  groupId,
}: {
  documentId: string
  groupId: string
}) {
  const getOtherReleases = useContext(OtherReleasesContext)
  if (!getOtherReleases) return null
  return <AlsoInOtherReleases documentId={documentId} otherReleases={getOtherReleases(groupId)} />
}
