/* eslint-disable @typescript-eslint/no-shadow,no-eq-null */
import {
  type ElementMap,
  type InitialDragState,
  type PanelElement,
  type PanelsState,
  type ResizerElement,
} from './types'

function getNextWidth(panel: PanelElement, nextWidth: number, containerWidth: number) {
  const {maxWidth: maxWidthPx, minWidth: minWidthPx} = panel
  const maxWidth = maxWidthPx == null ? 100 : (maxWidthPx / containerWidth) * 100
  const minWidth = (minWidthPx / containerWidth) * 100
  return Math.min(maxWidth, Math.max(minWidth, nextWidth))
}

// eslint-disable-next-line max-params
export function getNextWidths(
  delta: number,
  containerWidth: number,
  panelBefore: PanelElement,
  panelAfter: PanelElement,
  panelsState: PanelsState,
  initialDragState: InitialDragState,
): number[] {
  const {panels, widths: prevWidths} = panelsState
  const {widths: initialWidths} = initialDragState

  const widths = initialWidths || prevWidths
  const nextWidths = [...widths]

  {
    const pivotPanel = delta < 0 ? panelAfter : panelBefore
    const index = panels.findIndex((panel) => panel.id === pivotPanel.id)
    const width = widths[index]
    const nextWidth = getNextWidth(pivotPanel, width + Math.abs(delta), containerWidth)
    if (width === nextWidth) {
      return widths
    }
    delta = delta < 0 ? width - nextWidth : nextWidth - width
  }

  let deltaApplied = 0
  let pivotPanel = delta < 0 ? panelBefore : panelAfter
  let index = panels.findIndex((panel) => panel.id === pivotPanel.id)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const panel = panels[index]
    const width = widths[index]

    const deltaRemaining = Math.abs(delta) - Math.abs(deltaApplied)

    const nextWidth = getNextWidth(panel, width - deltaRemaining, containerWidth)

    if (width !== nextWidth) {
      deltaApplied += width - nextWidth
      nextWidths[index] = nextWidth

      if (
        deltaApplied.toPrecision(10).localeCompare(Math.abs(delta).toPrecision(10), undefined, {
          numeric: true,
        }) >= 0
      ) {
        break
      }
    }

    if (delta < 0) {
      if (--index < 0) {
        break
      }
    } else if (++index >= panels.length) {
      break
    }
  }

  if (deltaApplied === 0) {
    return widths
  }

  pivotPanel = delta < 0 ? panelAfter : panelBefore
  index = panels.findIndex((panel) => panel.id === pivotPanel.id)
  nextWidths[index] = widths[index] + deltaApplied

  return nextWidths
}

export function getPanelWidth(panels: PanelElement[], id: string, widths: number[]): string {
  if (panels.length === 1) return '100'

  const index = panels.findIndex((panel) => panel.id === id)
  const width = widths[index]

  // eslint-disable-next-line no-eq-null
  if (width == null) return '0'

  return width.toPrecision(10)
}

export function getOffset(
  event: MouseEvent,
  handleElement: HTMLDivElement,
  initialOffset: number = 0,
  initialHandleElementRect: DOMRect | null = null,
): number {
  const pointerOffset = event.clientX

  const rect = initialHandleElementRect || handleElement.getBoundingClientRect()
  const elementOffset = rect.left

  return pointerOffset - elementOffset - initialOffset
}

export function isPanel(element: PanelElement | ResizerElement): element is PanelElement {
  return element.type === 'panel'
}

export function isResizer(element: PanelElement | ResizerElement): element is ResizerElement {
  return element.type === 'resizer'
}

export function getSortedElements(elements: ElementMap): Array<PanelElement | ResizerElement> {
  return Array.from(elements.values()).sort(({order: a}, {order: b}) => {
    if (a == null && b == null) return 0
    if (a == null) return -1
    if (b == null) return 1
    return a - b
  })
}

export function validateWidths(
  panels: PanelElement[],
  widthsToValidate: number[],
  containerWidth: number,
): number[] {
  // Clamp widths proportionally to total 100
  const total = widthsToValidate.reduce((total, width) => total + width, 0)
  const widths = [...widthsToValidate].map((width) => (width / total) * 100)

  let remainingWidth = 0

  for (let index = 0; index < panels.length; index++) {
    const panel = panels[index]
    const width = widths[index]
    const nextWidth = getNextWidth(panel, width, containerWidth)
    if (width != nextWidth) {
      remainingWidth += width - nextWidth
      widths[index] = nextWidth
    }
  }

  if (remainingWidth.toFixed(3) !== '0.000') {
    for (let index = 0; index < panels.length; index++) {
      const panel = panels[index]

      let {maxWidth, minWidth} = panel

      minWidth = (minWidth / containerWidth) * 100
      if (maxWidth != null) {
        maxWidth = (maxWidth / containerWidth) * 100
      }

      const width = Math.min(
        // eslint-disable-next-line no-negated-condition
        maxWidth != null ? maxWidth : 100,
        Math.max(minWidth, widths[index] + remainingWidth),
      )

      if (width !== widths[index]) {
        remainingWidth -= width - widths[index]
        widths[index] = width

        if (Math.abs(remainingWidth).toFixed(3) === '0.000') {
          break
        }
      }
    }
  }

  return widths
}

export function getDefaultWidths(panels: PanelElement[]): number[] {
  let panelsWithoutWidth = panels.length
  let remainingWidthTotal = 100

  const widthsWithNulls = panels.map((panel) => {
    if (panel.defaultSize) {
      remainingWidthTotal -= panel.defaultSize
      panelsWithoutWidth -= 1
      return panel.defaultSize
    }
    return null
  })

  const defaultWidth = remainingWidthTotal / panelsWithoutWidth
  const widths = widthsWithNulls.map((width) => {
    if (width === null) return defaultWidth
    return width
  })

  return widths
}
