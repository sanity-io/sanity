import {Path} from '@sanity/types/src'
import {isEqual} from 'lodash'
import {useEffect, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {ObjectEditData} from '../types'

// This hook will scroll related editor item into view when the focusPath is pointing to a embedded object.
export function useScrollToFocusFromOutside(
  objectEditData: ObjectEditData,
  scrollElement: HTMLElement
): void {
  const pathRef = useRef<Path>(null)
  useEffect(() => {
    if (
      objectEditData &&
      objectEditData.editorHTMLElementRef.current &&
      !isEqual(pathRef.current, objectEditData.editorPath)
    ) {
      scrollIntoView(objectEditData.editorHTMLElementRef.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
      pathRef.current = objectEditData.editorPath
    }
  }, [objectEditData, scrollElement])
}
