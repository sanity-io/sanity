import {useCallback, useState} from 'react'

/** @internal */
export const useOnMouseDownCell = (
  handleProgrammaticFocus: () => void,
  setCellAsSelectedAnchor: () => void,
) => {
  const [shouldPreventDefaultMouseDown, setShouldPreventDefaultMouseDown] = useState(false)

  const handleOnMouseDown = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (shouldPreventDefaultMouseDown && event.detail === 2) {
        handleProgrammaticFocus()
      } else {
        if (shouldPreventDefaultMouseDown) event.preventDefault()
        setCellAsSelectedAnchor()
      }
    },
    [handleProgrammaticFocus, setCellAsSelectedAnchor, shouldPreventDefaultMouseDown],
  )

  return {setShouldPreventDefaultMouseDown, handleOnMouseDown}
}
