import {Card, Code} from '@sanity/ui'
import React from 'react'

export function CodeInput(props: any) {
  const {value} = props

  return (
    <Card border padding={3} radius={1}>
      <Code language={value?.language || 'js'} size={1}>
        {[
          `// @todo: Implement code input\n\n`,
          `const language = ${JSON.stringify(value?.language || 'js', null, 2)}\n`,
          `const raw = ${JSON.stringify(value?.code, null, 2)}\n`,
        ].join('')}
      </Code>
    </Card>
  )
}
