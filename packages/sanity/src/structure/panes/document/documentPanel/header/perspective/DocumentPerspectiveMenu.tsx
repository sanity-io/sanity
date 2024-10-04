import {ChevronDownIcon, DotIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {memo, useMemo} from 'react'
import {
  type BundleDocument,
  ReleaseBadge,
  ReleasesMenu,
  useDateTimeFormat,
  usePerspective,
  useTranslation,
} from 'sanity'
import {IntentLink} from 'sanity/router'
import {css, styled} from 'styled-components'

import {Button, Button as StudioButton, Tooltip} from '../../../../../../ui-components'
import {usePaneRouter} from '../../../../../components'
import {useDocumentPane} from '../../../useDocumentPane'

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

const BadgeButton = styled(Button)((props) => {
  const theme = getTheme_v2(props.theme)
  const mode = props.mode || 'default'
  const tone = props.tone || 'default'
  const color = theme.color.button[mode][tone]

  return css`
    cursor: pointer;
    border-radius: 999px !important;
    @media (hover: hover) {
      &:hover {
        text-decoration: none !important;
        background-color: ${color.hovered.bg};
      }
    }
  `
})

const ReleaseLink = ({release}: {release: Partial<BundleDocument>}) => {
  const {hue, title, icon, _id: releaseId} = release

  return (
    <BadgeButton
      mode="bleed"
      radius="full"
      data-testid="button-document-release"
      intent="release"
      params={{id: releaseId}}
      target="_blank"
      rel="noopener noreferrer"
      as={IntentLink}
    >
      <ReleaseBadge hue={hue} title={title} icon={icon} padding={2} />
    </BadgeButton>
  )
}

export const DocumentPerspectiveMenu = memo(function DocumentPerspectiveMenu() {
  const paneRouter = usePaneRouter()
  const {t} = useTranslation()
  const {currentGlobalBundle} = usePerspective(paneRouter.perspective)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const {documentVersions, existsInBundle, editState, displayed, ...other} = useDocumentPane()

  const releasesMenuButton = useMemo(
    () => (
      <StudioButton
        tooltipProps={{content: t('release.version-list.tooltip')}}
        icon={ChevronDownIcon}
        mode="bleed"
      />
    ),
    [t],
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
          href="google.com"
          mode="bleed"
          onClick={() => {}}
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

      {documentVersions?.map((release) => <div key={release._id}>{release.title}</div>)}
      {currentGlobalBundle && existsInBundle && <ReleaseLink release={currentGlobalBundle} />}
      <Box flex="none">
        <ReleasesMenu
          button={releasesMenuButton}
          bundles={documentVersions}
          loading={!documentVersions}
          perspective={paneRouter.perspective}
        />
      </Box>
    </>
  )
})
