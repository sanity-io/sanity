import {type ReactNode} from 'react'

import {paragraph} from './Paragraph.css'

export function Paragraph({children}: {children: ReactNode}): React.JSX.Element {
  // This can contain nested <div> elements, so it's not rendered as a <p> element
  return <div className={paragraph}>{children}</div>
}
