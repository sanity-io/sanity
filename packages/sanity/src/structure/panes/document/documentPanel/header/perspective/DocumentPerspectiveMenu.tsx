import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button} from '@sanity/ui'
import {useCallback} from 'react'
import {BundleBadge, BundleMenu, usePerspective} from 'sanity'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {usePaneRouter} from '../../../../../components'
import {useDocumentPane} from '../../../useDocumentPane'

const BadgeButton = styled(Button)({
  cursor: 'pointer',
})

export function DocumentPerspectiveMenu(): JSX.Element {
  const paneRouter = usePaneRouter()
  const {currentGlobalBundle} = usePerspective(paneRouter.perspective)

  const {documentVersions, existsInBundle} = useDocumentPane()
  const {title, hue, icon, slug} = currentGlobalBundle

  const router = useRouter()

  const handleBundleClick = useCallback(() => {
    router.navigateIntent('release', {slug})
  }, [router, slug])

  return (
    <>
      {currentGlobalBundle && existsInBundle && (
        <BadgeButton
          onClick={handleBundleClick}
          mode="bleed"
          padding={0}
          radius="full"
          data-testid="button-document-release"
        >
          <BundleBadge hue={hue} title={title} icon={icon} padding={2} />
        </BadgeButton>
      )}

      {/** TODO IS THIS STILL NEEDED? VS THE PICKER IN STUDIO NAVBAR? */}

      <Box flex="none">
        <BundleMenu
          button={<Button icon={ChevronDownIcon} mode="bleed" padding={2} space={2} />}
          bundles={documentVersions}
          loading={!documentVersions}
          perspective={paneRouter.perspective}
        />
      </Box>
    </>
  )
}
