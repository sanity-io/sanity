import {type ComponentType, type PropsWithChildren, useCallback, useState} from 'react'
import {createPortal} from 'react-dom'
import {styled} from 'styled-components'

/**
 * @internal
 */
export type TransformInnerText = (innerText: string | undefined) => string | undefined

const Hidden = styled.div`
  display: none;
`

/**
 * Visibly render only the text content of children, retrieved using `innerText`.
 *
 * @internal
 */
export const InnerText: ComponentType<PropsWithChildren<{transform?: TransformInnerText}>> = ({
  children,
  transform = (innerText) => innerText,
}) => {
  const [text, setText] = useState<string | undefined>()

  const ref = useCallback<(element: HTMLDivElement | null) => void>(
    (element) => setText(element?.innerText),
    [],
  )

  return (
    <>
      {transform(text)}
      {createPortal(<Hidden ref={ref}>{children}</Hidden>, document.body)}
    </>
  )
}
