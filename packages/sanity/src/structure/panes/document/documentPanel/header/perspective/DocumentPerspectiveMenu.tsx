import {DotIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {memo, useCallback} from 'react'
import {getVersionFromId, useDateTimeFormat, usePerspective, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, Tooltip} from '../../../../../../ui-components'
import {usePaneRouter} from '../../../../../components'
import {useDocumentPane} from '../../../useDocumentPane'
import {AddVersionButton} from './AddVersionButton'

const Chip = styled(Button)`
  border-radius: 9999px !important;
  transition: none;
  text-decoration: none !important;
  cursor: pointer;

  // target enabled state
  &:not([data-disabled='true']) {
    --card-border-color: var(--card-badge-default-bg-color);
  }
`

export const DocumentPerspectiveMenu = memo(function DocumentPerspectiveMenu() {
  const paneRouter = usePaneRouter()
  const {t} = useTranslation() // @todo add and update translations
  const {currentGlobalBundle, setPerspective} = usePerspective(paneRouter.perspective)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const {documentVersions, existsInBundle, editState, displayed} = useDocumentPane()

  const handleBundleChange = useCallback(
    (bundleId: string) => () => {
      setPerspective(bundleId)
    },
    [setPerspective],
  )

  return (
    <>
      <Tooltip
        content={
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
        fallbackPlacements={[]}
        portal
        placement="bottom"
      >
        <Chip
          disabled={!editState?.published}
          forwardedAs={editState?.published ? 'a' : 'button'}
          mode="bleed"
          onClick={handleBundleChange('published')}
          padding={2}
          paddingRight={3}
          radius="full"
          selected={editState?.published?._id === displayed?._id}
          style={{flex: 'none'}}
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          text={'Published'}
          tone="positive"
          icon={DotIcon}
        />
      </Tooltip>

      <Tooltip
        content={
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
        portal
      >
        <Chip
          disabled={!editState?.published && !editState?.draft}
          forwardedAs={editState?.published || editState?.draft ? 'a' : 'button'}
          icon={DotIcon}
          mode="bleed"
          onClick={handleBundleChange('drafts')}
          padding={2}
          paddingRight={3}
          radius="full"
          selected={editState?.draft?._id === displayed?._id}
          style={{flex: 'none'}}
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          text={'Draft'}
          tone={'caution'}
        />
      </Tooltip>

      {/* @todo update temporary text for tooltip */}
      {displayed &&
        documentVersions?.map((release) => (
          // eslint-disable-next-line i18next/no-literal-string
          <Tooltip key={release._id} content={<Text size={1}>temporary text</Text>} portal>
            <Chip
              forwardedAs="a"
              icon={DotIcon}
              mode="bleed"
              padding={2}
              paddingRight={3}
              radius="full"
              selected={release._id === getVersionFromId(displayed?._id || '')}
              onClick={handleBundleChange(release._id)}
              tone={'primary'}
              style={{flex: 'none'}}
              tooltipProps={{content: release.title}}
              text={release.title}
            />
          </Tooltip>
        ))}

      <AddVersionButton />
    </>
  )
})
