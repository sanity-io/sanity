import React, {useCallback} from 'react'

export function SelectPublishedButton({
  timeId,
  onSelect
}: {
  timeId: string | null
  onSelect: (timeId: string) => void
}) {
  const handleClick = useCallback(() => {
    if (timeId) onSelect(timeId)
  }, [onSelect])

  return (
    <button type="button" disabled={timeId === null} onClick={handleClick}>
      Compare against latest published
    </button>
  )
}
