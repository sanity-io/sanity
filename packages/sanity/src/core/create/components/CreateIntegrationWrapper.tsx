import type {LayoutProps} from '../../config/studio/types'
import {SanityCreateConfigProvider} from '../context/SanityCreateConfigProvider'

export function CreateIntegrationWrapper(props: LayoutProps) {
  return <SanityCreateConfigProvider>{props.renderDefault(props)}</SanityCreateConfigProvider>
}
