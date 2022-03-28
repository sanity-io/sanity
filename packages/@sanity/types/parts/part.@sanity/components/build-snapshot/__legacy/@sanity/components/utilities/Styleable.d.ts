import type React from 'react'
export default function Styleable(
  Component: React.ComponentType<{
    styles: Record<string, string>
  }>,
  defaultStyles: Record<string, string>
): {
  (props: {styles: Record<string, string>}): JSX.Element
  displayName: string
}
