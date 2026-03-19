import {Heading} from '@sanity/ui'
import {type ReactNode} from 'react'

import {styledHeading} from './Header.css'

const headingSizes: Record<string, number | undefined> = {
  h1: 2,
  h2: 1,
  h3: 0,
  h4: 0,
  h5: 0,
  h6: 0,
}

export function Header({style, children}: {style: string; children: ReactNode}): React.JSX.Element {
  return <Heading className={styledHeading} size={headingSizes[style]}>{children}</Heading>
}
