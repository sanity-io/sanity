import {type ComponentType} from 'react'

import {type LayoutProps} from '../../config'
import {AddonDatasetProvider} from '../../studio'
import {ReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'

export const ReleasesStudioLayout: ComponentType<LayoutProps> = (props) => {
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
