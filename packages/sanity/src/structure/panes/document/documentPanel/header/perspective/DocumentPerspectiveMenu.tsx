import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button} from '@sanity/ui'
import {useCallback} from 'react'
import {
  BundleBadge,
  type BundleDocument,
  BundleMenu,
  getBundleSlug,
  useDocumentVersions,
  usePerspective,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

const BadgeButton = styled(Button)({
  cursor: 'pointer',
})

export function DocumentPerspectiveMenu(props: {documentId: string}): JSX.Element {
  const {documentId} = props
  const {currentGlobalBundle} = usePerspective()

  const existsInBundle = getBundleSlug(documentId) === currentGlobalBundle?.slug
  const {title, hue, icon, slug} = currentGlobalBundle
  const {data: documentVersions} = useDocumentVersions({documentId})

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
          bundles={documentVersions as BundleDocument[]}
          loading={!documentVersions}
        />
      </Box>
    </>
  )
}
