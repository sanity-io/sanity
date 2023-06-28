import React, {useState} from 'react'

export function TestStory() {
  const [enabled, setEnabled] = useState(false)
  const handleClick = () => setEnabled(!enabled)

  return (
    <div>
      <h2>Testing</h2>
      <button type="button" onClick={handleClick} data-testid="toggle">
        Toggle
      </button>
      {enabled && <p>Enabled</p>}
    </div>
  )
}
