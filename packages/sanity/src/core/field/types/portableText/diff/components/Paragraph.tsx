import {type ReactNode} from 'react'

import {styledParagraph} from './Paragraph.css'

// This can contain nested <div> elements, so it's not rendered as a <p> element
export function Paragraph({children}: {children: ReactNode}): React.JSX.Element {
  return <div className={styledParagraph}>{children}</div>
}
