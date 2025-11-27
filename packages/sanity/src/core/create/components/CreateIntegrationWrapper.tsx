import {type LayoutProps} from '../../config'
import {SanityCreateConfigProvider} from '../context/SanityCreateConfigProvider'

export function CreateIntegrationWrapper(props: LayoutProps) : React.JSX.Element {
  return <SanityCreateConfigProvider>{props.renderDefault(props)}</SanityCreateConfigProvider>
}
