import {Card} from '@sanity/ui'
import {useColorSchemeValue} from '../../../colorScheme'

interface WrapperProps {
  children: React.ReactNode
  type: 'desktop' | 'mobile'
}

export function Wrapper({children, type}: WrapperProps) {
  const schemeValue = useColorSchemeValue()

  if (type === 'mobile') {
    return children
  }
  // In desktop the navbar is wrapped by a "dark" card, we need to reset the scheme
  return <Card scheme={schemeValue}>{children}</Card>
}
