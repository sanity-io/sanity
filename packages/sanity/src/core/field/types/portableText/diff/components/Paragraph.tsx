import {type ReactNode} from 'react'

import {styledParagraph} from './Paragraph.css'

export function Paragraph({children}: {children: ReactNode}): React.JSX.Element {
  return <div className={styledParagraph}>{children}</div>
}
