import {type FunctionComponent, type PropsWithChildren, useContext, useLayoutEffect} from 'react'
import {PresentationPanelsContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

interface PanelProps extends PropsWithChildren {
  defaultSize?: number | null
  /** Identifies the panel within the panel group; not rendered to the DOM. */
  id: string
  /** Optional DOM id applied to the panel's root element, e.g. for `aria-controls`. */
  htmlId?: string
  minWidth?: number
  maxWidth?: number
  order?: number
  /** Removes the panel from the flex layout without unmounting it, preserving any iframe state. */
  hidden?: boolean
}

const Root = styled.div`
  overflow: hidden;
  flex-basis: 0;
  flex-shrink: 1;
`

export const Panel: FunctionComponent<PanelProps> = function ({
  children,
  defaultSize = null,
  id,
  htmlId,
  minWidth,
  maxWidth,
  order = 0,
  hidden = false,
}) {
  const context = useContext(PresentationPanelsContext)

  if (context === null) {
    throw Error(`Panel components must be rendered within a PanelGroup container`)
  }

  const {getPanelStyle, registerElement, unregisterElement} = context

  // A hidden panel stays mounted (so the preview iframe keeps its state) but
  // leaves the flex layout entirely, letting the remaining visible panel fill
  // the container regardless of its persisted width.
  const style = hidden ? {display: 'none'} : getPanelStyle(id)

  useLayoutEffect(() => {
    registerElement(id, {
      id,
      type: 'panel',
      defaultSize,
      maxWidth: maxWidth ?? null,
      minWidth: minWidth ?? 0,
      order,
    })

    return () => {
      unregisterElement(id)
    }
  }, [id, defaultSize, order, maxWidth, minWidth, registerElement, unregisterElement])

  return (
    <Root id={htmlId} style={style}>
      {children}
    </Root>
  )
}
