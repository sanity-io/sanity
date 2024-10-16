import {DotIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {memo, useCallback} from 'react'
import {
  getVersionFromId,
  useBundles,
  useDateTimeFormat,
  usePerspective,
  useTranslation,
} from 'sanity'

import {versionDocumentExists} from '../../../../../../core/releases'
import {usePaneRouter} from '../../../../../components'
import {useDocumentPane} from '../../../useDocumentPane'
import {VersionChip} from './VersionChip'
import {VersionPopoverMenu} from './VersionPopoverMenu'

export const DocumentPerspectiveMenu = memo(function DocumentPerspectiveMenu() {
  const paneRouter = usePaneRouter()
  const {t} = useTranslation() // @todo add and update translations
  const {setPerspective} = usePerspective(paneRouter.perspective)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const {data: bundles, loading} = useBundles()

  const {documentVersions, editState, displayed, documentType} = useDocumentPane()

  // remove the versions that the document already has
  // remove the archived releases
  const filteredReleases =
    (documentVersions &&
      bundles?.filter(
        (bundle) => !versionDocumentExists(documentVersions, bundle._id) && !bundle.archivedAt,
      )) ||
    []

  const handleBundleChange = useCallback(
    (bundleId: string) => () => {
      setPerspective(bundleId)
    },
    [setPerspective],
  )

  return (
    <>
      <VersionChip
        tooltipContent={
          <Text size={1}>
            {editState?.published && editState?.published?._updatedAt ? (
              // eslint-disable-next-line i18next/no-literal-string
              <>Published {dateTimeFormat.format(new Date(editState?.published._updatedAt))}</>
            ) : (
              // eslint-disable-next-line i18next/no-literal-string
              <>Not published</>
            )}
          </Text>
        }
        disabled={!editState?.published}
        onClick={handleBundleChange('published')}
        selected={editState?.published?._id === displayed?._id}
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        text="Published"
        icon={DotIcon}
        tone="positive"
      />
      <VersionChip
        tooltipContent={
          <Text size={1}>
            {editState?.draft ? (
              <>
                {editState?.draft.updatedAt ? (
                  // eslint-disable-next-line i18next/no-literal-string
                  <>Edited {dateTimeFormat.format(new Date(editState?.draft._updatedAt))}</>
                ) : (
                  // eslint-disable-next-line i18next/no-literal-string
                  <>Created {dateTimeFormat.format(new Date(editState?.draft._createdAt))}</>
                )}
              </>
            ) : (
              // eslint-disable-next-line i18next/no-literal-string
              <>No edits</>
            )}
          </Text>
        }
        disabled={!editState?.published && !editState?.draft}
        icon={DotIcon}
        selected={editState?.draft?._id === displayed?._id}
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        text="Draft"
        tone="caution"
        onClick={handleBundleChange('drafts')}
      />

      {/* @todo update temporary text for tooltip */}
      {displayed &&
        documentVersions?.map((release) => (
          <VersionChip
            key={release._id}
            // eslint-disable-next-line i18next/no-literal-string
            tooltipContent={<Text size={1}>temporary text</Text>}
            selected={release._id === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release._id)}
            text={release.title}
            tone={'primary'}
            icon={DotIcon}
            menuContent={
              <VersionPopoverMenu
                documentId={displayed?._id || ''}
                menuReleaseId={release._id}
                releases={filteredReleases}
                releasesLoading={loading}
                documentType={documentType}
              />
            }
          />
        ))}
    </>
  )
})
