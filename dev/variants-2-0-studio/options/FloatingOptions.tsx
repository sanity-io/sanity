import {CloseIcon} from '@sanity/icons/Close'
import {ControlsIcon} from '@sanity/icons/Controls'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {type LayoutProps} from 'sanity'

import {COMPONENTS} from './registry'
import {maxOptionCount, resetOptions, resolveOption, setGlobalChoice, setOverride, useOptionState} from './store'

const LETTERS = 'ABCDEFGH'

// Floats over the Studio instead of taking layout space, so document heights stay real. Open or
// closed is per page load, and "hide" is deliberately not remembered: a refresh brings it back.
function FloatingOptions() {
  const state = useOptionState()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const overrideCount = Object.keys(state.overrides).length
  const choices = Array.from({length: maxOptionCount()}, (_, index) => index)
  const label = state.global === 'final' ? 'F' : LETTERS[state.global]

  if (hidden) return null

  return (
    <div style={{position: 'fixed', left: 16, bottom: 16, zIndex: 1000000}}>
      {open ? (
        <Card radius={3} shadow={3} style={{width: 340, maxHeight: '70vh', overflow: 'auto'}}>
          <Stack gap={3} padding={3}>
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Text size={1} weight="semibold">Variants 2.0 options</Text>
              </Box>
              {overrideCount > 0 && (
                <Button fontSize={0} mode="bleed" onClick={resetOptions} padding={2} text={`Reset ${overrideCount}`} />
              )}
              <Button aria-label="Collapse" icon={CloseIcon} mode="bleed" onClick={() => setOpen(false)} padding={2} />
            </Flex>

            <Stack gap={2}>
              <Text muted size={0}>All components</Text>
              <Flex gap={1}>
                {choices.map((index) => (
                  <Button
                    fontSize={1}
                    key={index}
                    mode={state.global === index ? 'default' : 'ghost'}
                    onClick={() => setGlobalChoice(index)}
                    padding={2}
                    text={LETTERS[index]}
                    tone={state.global === index ? 'primary' : 'default'}
                  />
                ))}
                <Button
                  fontSize={1}
                  mode={state.global === 'final' ? 'default' : 'ghost'}
                  onClick={() => setGlobalChoice('final')}
                  padding={2}
                  text="Final"
                  tone={state.global === 'final' ? 'positive' : 'default'}
                />
              </Flex>
            </Stack>

            <Stack gap={2}>
              <Text muted size={0}>Per component</Text>
              {COMPONENTS.filter((component) => component.options.length > 1).map((component) => {
                const active = resolveOption(component, state)
                return (
                  <Flex align="center" gap={2} key={component.id}>
                    <Box flex={1}>
                      <Text size={1}>{component.title}</Text>
                    </Box>
                    <Flex gap={1}>
                      {component.options.map((option) => (
                        <Button
                          fontSize={0}
                          key={option.id}
                          mode={active === option.id ? 'default' : 'ghost'}
                          onClick={() => setOverride(component.id, state.overrides[component.id] === option.id ? null : option.id)}
                          padding={2}
                          text={option.id.toUpperCase()}
                          title={`${option.label}. ${option.summary}`}
                          tone={state.overrides[component.id] === option.id ? 'primary' : 'default'}
                        />
                      ))}
                    </Flex>
                  </Flex>
                )
              })}
            </Stack>

            <Flex justify="flex-end">
              <Button fontSize={0} mode="bleed" onClick={() => setHidden(true)} padding={2} text="Hide until refresh" />
            </Flex>
          </Stack>
        </Card>
      ) : (
        <Card radius="full" shadow={2}>
          <Button
            aria-label="Variants 2.0 options"
            icon={ControlsIcon}
            onClick={() => setOpen(true)}
            radius="full"
            text={overrideCount > 0 ? `${label} +${overrideCount}` : label}
            tone="primary"
          />
        </Card>
      )}
    </div>
  )
}

export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    <>
      {props.renderDefault(props)}
      <FloatingOptions />
    </>
  )
}
