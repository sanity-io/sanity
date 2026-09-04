import {type ReactNode} from 'react'

import {quote} from './Blockquote.css'

export function Blockquote({children}: {children: ReactNode}): React.JSX.Element {
  return (
    <div>
      <blockquote className={quote}>{children}</blockquote>
    </div>
  )
}
