import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button} from '@sanity/ui'
import {useCallback, useEffect, useMemo} from 'react'
import {
  BundleBadge,
  type BundleDocument,
  BundleMenu,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getAllVersionsOfDocument,
  getBundleSlug,
  useBundles,
  useClient,
  useDocumentPerspective,
  usePerspective,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

const BadgeButton = styled(Button)({
  cursor: 'pointer',
})

export function DocumentPerspectiveMenu(props: {documentId: string}): JSX.Element {
  const {documentId} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {data} = useBundles()
  const {currentGlobalBundle} = usePerspective()
  const bundles = useMemo(() => data ?? [], [data])

  const existsInBundle = getBundleSlug(documentId) === currentGlobalBundle?.slug
  const {title, hue, icon, slug} = currentGlobalBundle
  const {data: documentVersions} = useDocumentPerspective({documentId})

  const router = useRouter()

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  //const [documentVersions, setDocumentVersions] = useState<BundleDocument[]>([])

  const fetchVersions = useCallback(async () => {
    const response = await getAllVersionsOfDocument(bundles, client, documentId)
    //setDocumentVersions(response)
  }, [bundles, client, documentId])

  // DUMMY FETCH -- NEEDS TO BE REPLACED -- USING GROQ from utils
  useEffect(() => {
    const fetchVersionsInner = async () => {
      fetchVersions()
    }

    fetchVersionsInner()
  }, [fetchVersions])

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
      {documentVersions && documentVersions.length > 0 && (
        <Box flex="none">
          <BundleMenu
            button={<Button icon={ChevronDownIcon} mode="bleed" padding={2} space={2} />}
            bundles={documentVersions as BundleDocument[]}
            loading={!documentVersions}
          />
        </Box>
      )}
    </>
  )
}
