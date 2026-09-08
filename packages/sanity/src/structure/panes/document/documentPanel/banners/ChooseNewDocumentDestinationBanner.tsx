import {type ReleaseDocument} from '@sanity/client'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type ObjectSchemaType} from '@sanity/types'
import {Text} from '@sanity/ui'
import {type ComponentType, type ReactNode, useCallback} from 'react'
import {
  getReleaseTone,
  isPerspectiveWriteable,
  isReleaseDocument,
  type PerspectiveNotWriteableReason,
  ReleasesNav,
  type ReleasesNavMenuItemPropsGetter,
  ReleaseTitle,
  type TargetPerspective,
  Translate,
  useTranslation,
  useWorkspace,
  VersionInlineBadge,
} from 'sanity'
import {Flex} from 'ui5'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

interface Props {
  schemaType: ObjectSchemaType
  selectedPerspective: TargetPerspective
  reason: PerspectiveNotWriteableReason
}

function ReleaseInactiveVersionBadge({
  children,
  fallbackTitle,
  releaseDoc,
}: {
  children?: ReactNode
  fallbackTitle?: string
  releaseDoc?: ReleaseDocument
}) {
  if (!releaseDoc) return null
  return (
    <ReleaseTitle title={releaseDoc.metadata.title} fallback={fallbackTitle ?? ''}>
      {() => <VersionInlineBadge $tone={getReleaseTone(releaseDoc)}>{children}</VersionInlineBadge>}
    </ReleaseTitle>
  )
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
  const releaseTitle = releaseDoc
    ? releaseDoc.metadata.title || tCore('release.placeholder-untitled-release')
    : undefined

  return (
    <Banner
      tone="caution"
      icon={WarningOutlineIcon}
      content={
        <Flex alignItems="center" gap={2}>
          <Text size={1}>
            {reason === 'PUBLISHED_NOT_WRITEABLE' &&
              t('banners.choose-new-document-destination.cannot-create-published-document')}
            {reason === 'DRAFTS_NOT_WRITEABLE' &&
              t('banners.choose-new-document-destination.cannot-create-draft-document')}
            {reason === 'RELEASE_NOT_ACTIVE' && releaseDoc && releaseTitle && (
              <Translate
                t={t}
                i18nKey="banners.choose-new-document-destination.release-inactive"
                values={{
                  title: releaseTitle,
                }}
                components={{VersionBadge: ReleaseInactiveVersionBadge}}
                componentProps={{
                  fallbackTitle: tCore('release.placeholder-untitled-release'),
                  releaseDoc,
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
