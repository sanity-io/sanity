import {isElement} from 'react-is'

export function childrenToElementArray(children: React.ReactNode): React.ReactElement[] {
  const childrenArray = Array.isArray(children) ? children : [children]

  return childrenArray.filter(isElement)
}
