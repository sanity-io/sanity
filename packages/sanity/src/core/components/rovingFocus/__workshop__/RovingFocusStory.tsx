import {Card, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useState} from 'react'
import {useRovingFocus} from '../useRovingFocus'
import {Button} from '../../../../ui'

const DIRECTION_OPTIONS: Record<string, 'horizontal' | 'vertical'> = {
  horizontal: 'horizontal',
  vertical: 'vertical',
}

const INITIAL_FOCUS: Record<string, 'first' | 'last'> = {
  first: 'first',
  last: 'last',
}

const FLEX_DIRECTION: Record<string, 'column' | 'row'> = {
  horizontal: 'row',
  vertical: 'column',
}

const OPTIONS = [...Array(5).keys()]

export default function RovingFocusStory() {
  const direction = useSelect('Direction', DIRECTION_OPTIONS, 'horizontal')
  const initialFocus = useSelect('Initial focus', INITIAL_FOCUS, 'first')
  const loop = useBoolean('Loop', true)
  const withDisabled = useBoolean('With disabled elements', false)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  useRovingFocus({
    direction: direction,
    initialFocus: initialFocus,
    loop: loop,
    rootElement: rootElement,
  })

  return (
    <Flex align="center" height="fill" justify="center">
      <Card padding={3} radius={3} shadow={1}>
        <Flex
          gap={2}
          direction={direction ? FLEX_DIRECTION[direction] : undefined}
          ref={setRootElement}
        >
          {OPTIONS.map((num) => (
            <Button
              text={`Option ${num + 1}`}
              disabled={Boolean(withDisabled && num % 2)}
              key={num}
              mode="ghost"
            />
          ))}
        </Flex>
      </Card>
    </Flex>
  )
}
