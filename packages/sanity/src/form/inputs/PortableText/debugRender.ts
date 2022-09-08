const DEBUG_RENDERING = false

function getRandomColor(): string {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

export function debugRender(style?: React.CSSProperties): React.CSSProperties | undefined {
  return DEBUG_RENDERING
    ? {
        ...(style ? style : {}),
        color: style && style.color ? style.color : getRandomColor(),
        background: style && style.background ? style.background : getRandomColor(),
      }
    : undefined
}
