import {getSanityCreateLinkMetadata, useSanityCreateConfig} from 'sanity'

import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function CreateLinkedBanner() : React.JSX.Element {
  const {value} = useDocumentPane()
  const {documentLinkedBannerContent: CreateLinkedBannerContent} =
    useSanityCreateConfig().components ?? {}
  const createLinkMetadata = getSanityCreateLinkMetadata(value)

  if (!CreateLinkedBannerContent || !createLinkMetadata) return null

  return (
    <Banner
      tone="transparent"
      data-test-id="sanity-create-read-only-banner"
      content={<CreateLinkedBannerContent metadata={createLinkMetadata} />}
    />
  )
}
