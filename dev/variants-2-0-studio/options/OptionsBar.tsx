import {Box, Button, Flex, Inline, Text} from '@sanity/ui'
import {type LayoutProps} from 'sanity'

import {maxOptionCount, resetOptions, setGlobalChoice, useOptionState} from './store'

const LETTERS = 'ABCDEFGH'

// Global toolbar: pick the Nth option for every component at once ("A everywhere"), or follow
// each component's signed-off option. Per-component overrides live in the Variants 2.0 tool.
function OptionsBar() {
  const {global, overrides} = useOptionState()
  const overrideCount = Object.keys(overrides).length
  const choices = Array.from({length: maxOptionCount()}, (_, index) => index)

  return (
    <Box padding={2} style={{borderBottom: '1px solid var(--card-border-color)'}}>
      <Flex align="center" gap={3}>
        <Text size={1} weight="medium">Variants 2.0 options</Text>
        <Inline space={1}>
          {choices.map((index) => (
            <Button
              key={index}
              fontSize={1}
              mode={global === index ? 'default' : 'ghost'}
              onClick={() => setGlobalChoice(index)}
              padding={2}
              text={LETTERS[index]}
              tone={global === index ? 'primary' : 'default'}
            />
          ))}
          <Button
            fontSize={1}
            mode={global === 'final' ? 'default' : 'ghost'}
            onClick={() => setGlobalChoice('final')}
            padding={2}
            text="Final"
            tone={global === 'final' ? 'positive' : 'default'}
          />
        </Inline>
        {overrideCount > 0 && (
          <Button
            fontSize={1}
            mode="bleed"
            onClick={resetOptions}
            padding={2}
            text={`${overrideCount} override${overrideCount === 1 ? '' : 's'} · reset`}
          />
        )}
      </Flex>
    </Box>
  )
}

export function LayoutWithOptionsBar(props: LayoutProps) {
  return (
    <Flex direction="column" style={{height: '100%'}}>
      <OptionsBar />
      <Box flex={1} style={{minHeight: 0, position: 'relative'}}>
        {props.renderDefault(props)}
      </Box>
    </Flex>
  )
}
