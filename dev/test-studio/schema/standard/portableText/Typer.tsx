import React, {useCallback, useEffect} from 'react'

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function getRandomCharacter() {
  return characters.charAt(Math.floor(Math.random() * characters.length))
}

export function Typer() {
  const [text, setText] = React.useState('')
  const [enabled, setEnabled] = React.useState(true)
  const handleCheckboxChange = useCallback((e) => {
    setEnabled(e.target.checked)
  }, [])
  useEffect(() => {
    let i
    if (enabled) {
      i = setInterval(() => {
        setText((t) => `${getRandomCharacter()} ${t} `.substring(0, 10))
      }, 16)
    }
    return () => {
      clearInterval(i)
    }
  }, [enabled])
  return (
    <div>
      <input type="checkbox" checked={enabled} onChange={handleCheckboxChange} /> {text}
    </div>
  )
}
