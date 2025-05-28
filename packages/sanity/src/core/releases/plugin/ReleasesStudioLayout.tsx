import {type LayoutProps} from '../../config'
import {ReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'
import {ReleasesUpsellProvider} from '../contexts/upsell/ReleasesUpsellProvider'
import {useReleasesToolAvailable} from '../hooks/useReleasesToolAvailable'

export function ReleasesStudioLayout(props: LayoutProps) {
  const releasesToolAvailable = useReleasesToolAvailable()

  if (!releasesToolAvailable) {
    return props.renderDefault(props)
  }

  return (
    <ReleasesUpsellProvider>
      <ReleasesMetadataProvider>{props.renderDefault(props)}</ReleasesMetadataProvider>
    </ReleasesUpsellProvider>
  )
}
