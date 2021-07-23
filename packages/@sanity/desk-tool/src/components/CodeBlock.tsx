import React from 'react'

export function CodeBlock({children, ...restProps}: React.HTMLProps<HTMLPreElement>) {
  return (
    <pre {...restProps}>
      <code>{children}</code>
    </pre>
  )
}
