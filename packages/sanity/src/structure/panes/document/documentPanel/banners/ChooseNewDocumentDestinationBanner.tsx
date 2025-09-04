import {WarningOutlineIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'
import {type ComponentType, useCallback} from 'react'
import {
  getVersionInlineBadge,
  isPerspectiveWriteable,
  isReleaseDocument,
  type PerspectiveNotWriteableReason,
  ReleasesNav,
  type ReleasesNavMenuItemPropsGetter,
  type TargetPerspective,
  Translate,
  useTranslation,
  useWorkspace,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

interface Props {
  schemaType: ObjectSchemaType
  selectedPerspective: TargetPerspective
  reason: PerspectiveNotWriteableReason
}

/**
 * This banner is displayed when a user attempts to create a new document in a perspective that's
 * not writeable. For example:
 *
 * - The published perspective (unless the schema type supports live-editing).
 * - Any release that's locked.
 */
export const ChooseNewDocumentDestinationBanner: ComponentType<Props> = ({
  schemaType,
  selectedPerspective,
  reason,
}) => {
  const {t} = useTranslation(structureLocaleNamespace)

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const menuItemProps = useCallback<ReleasesNavMenuItemPropsGetter>(
    ({perspective}) => ({
      disabled: !isPerspectiveWriteable({
        selectedPerspective: perspective,
        isDraftModelEnabled,
        schemaType,
      }).result,
    }),
    [isDraftModelEnabled, schemaType],
  )

  return (
    <Banner
      tone="caution"
      icon={WarningOutlineIcon}
      content={
        <Flex align="center" gap={2}>
          <Text size={1}>
            {reason === 'PUBLISHED_NOT_WRITEABLE' &&
              t('banners.choose-new-document-destination.cannot-create-published-document')}
            {reason === 'DRAFTS_NOT_WRITEABLE' &&
              t('banners.choose-new-document-destination.cannot-create-draft-document')}
            {reason === 'RELEASE_NOT_ACTIVE' && isReleaseDocument(selectedPerspective) && (
              <Translate
                t={t}
                i18nKey="banners.choose-new-document-destination.release-inactive"
                values={{
                  title: selectedPerspective.metadata.title,
                }}
                components={{
                  VersionBadge: getVersionInlineBadge(selectedPerspective),
                }}
              />
            )}
            <> {t('banners.choose-new-document-destination.choose-destination')}</>
          </Text>
          <ReleasesNav menuItemProps={menuItemProps} />
        </Flex>
      }
    />
  )
}
