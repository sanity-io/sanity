import type {ClientRect, Modifier} from '@dnd-kit/core'
import type {Transform} from '@dnd-kit/utilities'

function restrictToBoundingRect(
  transform: Transform,
  rect: ClientRect,
  boundingRect: ClientRect,
  margins: Margins,
): Transform {
  const value = {
    ...transform,
  }

  const marginY = margins.y || 0
  const marginX = margins.x || 0

  if (rect.top + value.y <= boundingRect.top + marginY) {
    value.y = boundingRect.top - rect.top + marginY
  } else if (rect.bottom + value.y >= boundingRect.top + boundingRect.height - marginY) {
    value.y = boundingRect.top + boundingRect.height - rect.bottom - marginY
  }

  if (rect.left + value.x <= boundingRect.left - marginX) {
    value.x = boundingRect.left - rect.left + marginX
  } else if (rect.right + value.x >= boundingRect.left + boundingRect.width + marginX) {
    value.x = boundingRect.left + boundingRect.width - rect.right + marginX
  }

  return value
}

interface Margins {
  x?: number
  y?: number
}

export const restrictToParentElementWithMargins: (margins: Margins) => Modifier =
  (margins: Margins) =>
  ({containerNodeRect, draggingNodeRect, transform}) => {
    if (!draggingNodeRect || !containerNodeRect) {
      return transform
    }

    return restrictToBoundingRect(transform, draggingNodeRect, containerNodeRect, margins)
  }
