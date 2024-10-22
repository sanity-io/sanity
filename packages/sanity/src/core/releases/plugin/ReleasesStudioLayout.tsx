import {type LayoutProps} from '../../config'
import {AddonDatasetProvider} from '../../studio'
import {ReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'

export function ReleasesStudioLayout(props: LayoutProps) {
  // TODO: Replace for useReleasesEnabled
  const {enabled} = {enabled: true}

  if (!enabled) {
    return props.renderDefault(props)
  }

  return (
    <AddonDatasetProvider>
      <ReleasesMetadataProvider>{props.renderDefault(props)}</ReleasesMetadataProvider>
    </AddonDatasetProvider>
  )
}
