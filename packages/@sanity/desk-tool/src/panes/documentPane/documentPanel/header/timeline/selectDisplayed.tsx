import React, {useCallback} from 'react'
import {useDocumentHistory} from '../../../documentHistory'

export function SelectHistoryDisplayed({
  value
}: // onChange
{
  value: 'from' | 'to'
  // onChange: (newValue: 'from' | 'to') => void
}) {
  const {toggleHistoryDisplayed} = useDocumentHistory()

  const handleToggleNewest = useCallback(
    evt => toggleHistoryDisplayed(evt.target.checked ? 'to' : 'from'),
    [toggleHistoryDisplayed]
  )

  const handleToggleOldest = useCallback(
    evt => toggleHistoryDisplayed(evt.target.checked ? 'from' : 'to'),
    [toggleHistoryDisplayed]
  )

  return (
    <div>
      <div>
        <label>
          Newest <input type="radio" checked={value === 'to'} onChange={handleToggleNewest} />
        </label>
      </div>

      <div>
        <label>
          Oldest <input type="radio" checked={value === 'from'} onChange={handleToggleOldest} />
        </label>
      </div>
    </div>
  )
}
