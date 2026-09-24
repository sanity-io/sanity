import {type ReactNode} from 'react'
import {Text} from 'ui5'

import {normalText} from './NormalBlock.css'

interface NormalBlockProps {
  children: ReactNode
}

export function NormalBlock(props: NormalBlockProps): React.JSX.Element {
  const {children} = props

  return (
    <Text className={normalText} size={1} as="div" trim={true}>
      {children}
    </Text>
  )
}
