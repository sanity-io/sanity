import {type ComponentType} from 'react'

import {type LayoutProps} from '../../config'
import {AddonDatasetProvider} from '../../studio'
import {ReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'

export const ReleasesStudioLayout: ComponentType<LayoutProps> = (props) => (
  <AddonDatasetProvider>
    <ReleasesMetadataProvider>{props.renderDefault(props)}</ReleasesMetadataProvider>
  </AddonDatasetProvider>
)
