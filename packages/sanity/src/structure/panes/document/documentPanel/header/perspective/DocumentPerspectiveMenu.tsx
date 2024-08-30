import {ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button} from '@sanity/ui'
import {memo, useCallback, useMemo} from 'react'
import {BundleBadge, BundlesMenu, usePerspective, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {Button as StudioButton} from '../../../../../../ui-components'
import {usePaneRouter} from '../../../../../components'
import {useDocumentPane} from '../../../useDocumentPane'

const BadgeButton = styled(Button)({
  cursor: 'pointer',
})

export const DocumentPerspectiveMenu = memo(function DocumentPerspectiveMenu() {
  const paneRouter = usePaneRouter()
  const {t} = useTranslation()
  const {currentGlobalBundle} = usePerspective(paneRouter.perspective)

  const {documentVersions, existsInBundle} = useDocumentPane()
  const {title, hue, icon, _id: bundleId} = currentGlobalBundle

  const router = useRouter()

  const handleBundleClick = useCallback(() => {
    router.navigateIntent('release', {id: bundleId})
  }, [router, bundleId])

  const bundlesMenuButton = useMemo(
    () => (
      <StudioButton
        tooltipProps={{content: t('bundle.version-list.tooltip')}}
        icon={ChevronDownIcon}
        mode="bleed"
      />
    ),
    [t],
  )

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
        <BundlesMenu
          button={bundlesMenuButton}
          bundles={documentVersions}
          loading={!documentVersions}
          perspective={paneRouter.perspective}
        />
      </Box>
    </>
  )
})
