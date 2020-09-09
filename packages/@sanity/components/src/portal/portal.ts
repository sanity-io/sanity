import ReactDOM from 'react-dom'

import {usePortal} from './hooks'

interface PortalProps {
  children: React.ReactNode
}

export function Portal(props: PortalProps) {
  const portal = usePortal()

  if (!portal.element) {
    return null
  }

  return ReactDOM.createPortal(props.children, portal.element)
}
