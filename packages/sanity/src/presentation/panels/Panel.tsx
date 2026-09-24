import {type FunctionComponent, type PropsWithChildren, useContext, useLayoutEffect} from 'react'
import {PresentationPanelsContext} from 'sanity/_singletons'

import {root} from './Panel.css'

interface PanelProps extends PropsWithChildren {
  defaultSize?: number | null
  /** Panel group key; not a DOM id. */
  id: string
  /** DOM id for the root element (e.g. aria-controls target). */
  htmlId?: string
  minWidth?: number
  maxWidth?: number
  order?: number
  /** Hide via display:none without unmounting (keeps iframe state). */
  hidden?: boolean
}

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

  // Hidden panels stay mounted (preserving iframe state) but leave the flex layout so siblings fill the space.
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
    <div className={root} id={htmlId} style={style}>
      {children}
    </div>
  )
}
