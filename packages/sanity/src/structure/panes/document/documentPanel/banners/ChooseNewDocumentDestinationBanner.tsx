import {WarningOutlineIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Box, Flex, Text} from '@sanity/ui'
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
  getReleaseTitleDetails,
  useTranslation,
  useWorkspace,
} from 'sanity'

import {Tooltip} from '../../../../../ui-components'
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
  const {t: tCore} = useTranslation()

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

  const releaseDoc = isReleaseDocument(selectedPerspective) ? selectedPerspective : undefined
  const titleDetails = releaseDoc
    ? getReleaseTitleDetails(
        releaseDoc.metadata.title,
        tCore('release.placeholder-untitled-release'),
      )
    : undefined

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
            {reason === 'RELEASE_NOT_ACTIVE' && releaseDoc && titleDetails && (
              <Translate
                t={t}
                i18nKey="banners.choose-new-document-destination.release-inactive"
                values={{
                  title: titleDetails.displayTitle,
                }}
                components={{
                  VersionBadge: ({children}) => {
                    const BadgeWithTone = getVersionInlineBadge(releaseDoc)
                    return (
                      <Tooltip
                        disabled={!titleDetails.isTruncated}
                        content={
                          <Box style={{maxWidth: '300px'}}>
                            <Text size={1}>{titleDetails.fullTitle}</Text>
                          </Box>
                        }
                      >
                        <BadgeWithTone>{children}</BadgeWithTone>
                      </Tooltip>
                    )
                  },
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
