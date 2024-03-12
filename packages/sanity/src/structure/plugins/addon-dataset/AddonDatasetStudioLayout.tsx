import {AddonDatasetProvider, type LayoutProps} from 'sanity'

export function AddonDatasetStudioLayout(props: LayoutProps) {
  return <AddonDatasetProvider>{props.renderDefault(props)}</AddonDatasetProvider>
}
