import {ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {memo, useMemo} from 'react'
import {type BundleDocument, ReleaseBadge, usePerspective, useTranslation} from 'sanity'
import {IntentLink} from 'sanity/router'
import {css, styled} from 'styled-components'

import {Button as StudioButton} from '../../../../../../ui-components'
import {usePaneRouter} from '../../../../../components'
import {useDocumentPane} from '../../../useDocumentPane'

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
      padding={0}
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

  const {documentVersions, existsInBundle} = useDocumentPane()

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
      {currentGlobalBundle && existsInBundle && <ReleaseLink release={currentGlobalBundle} />}

      {/** TODO IS THIS STILL NEEDED? VS THE PICKER IN STUDIO NAVBAR? */}
    </>
  )
})
