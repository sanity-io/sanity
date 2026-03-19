import {type FunctionComponent, type PropsWithChildren, useContext, useLayoutEffect} from 'react'
import {PresentationPanelsContext} from 'sanity/_singletons'
import {root as rootClass} from './Panel.css'

interface PanelProps extends PropsWithChildren {
  defaultSize?: number | null
  id: string
  minWidth?: number
  maxWidth?: number
  order?: number
}


export const Panel: FunctionComponent<PanelProps> = function ({
  children,
  defaultSize = null,
  id,
  minWidth,
  maxWidth,
  order = 0,
}) {
  const context = useContext(PresentationPanelsContext)

  if (context === null) {
    throw Error(`Panel components must be rendered within a PanelGroup container`)
  }

  const {getPanelStyle, registerElement, unregisterElement} = context

  const style = getPanelStyle(id)

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

  return <div className={rootClass} style={style}>{children}</div>
}
