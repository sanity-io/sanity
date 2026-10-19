import {CloseIcon} from '@sanity/icons/Close'
import {ControlsIcon} from '@sanity/icons/Controls'
import {Badge, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {type LayoutProps, PerspectiveMenuExtensionProvider} from 'sanity'
import {DocumentListItemOverrideProvider, DocumentPaneExtensionProvider} from 'sanity/structure'

import {PerspectiveProvider} from '../c1/state'
import {useOptionAExtension} from '../c1/Controls'
import {useRowOverride} from '../c3/RowOverride'
import {useDocumentPaneOverride} from '../pane/useDocumentPaneOverride'
import {COMPONENTS, type OptionStatus} from './registry'
import {
  maxOptionCount,
  resetOptions,
  resolveOption,
  setDimensionLimit,
  setGlobalChoice,
  setStage,
  setOverride,
  useOptionState,
} from './store'

const LETTERS = 'ABCDEFGH'

const STATUS_TONE: Record<OptionStatus, 'positive' | 'primary' | 'caution'> = {
  final: 'positive',
  candidate: 'primary',
  exploration: 'caution',
}

// Floats over the Studio instead of taking layout space, so document heights stay real. Open or
// closed is per page load, and "hide" is deliberately not remembered: a refresh brings it back.
function FloatingOptions() {
  const state = useOptionState()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const overrideCount = Object.keys(state.overrides).length
  const choices = Array.from({length: maxOptionCount()}, (_, index) => index)
  // The pill says what is rendered: the resolved option of every built component, and the stage.
  const built = COMPONENTS.filter((component) => component.built)
  const label =
    state.global === 'stock'
      ? 'Stock'
      : built.map((component) => `${component.id.toUpperCase()} ${resolveOption(component, state).toUpperCase()}`).join(' · ') +
        ` · ${state.stage === 'open-beta' ? 'Open beta' : 'GA'}`

  if (hidden) return null

  return (
    <div style={{position: 'fixed', left: 16, bottom: 16, zIndex: 1000000}}>
      {open ? (
        <Card radius={3} shadow={3} style={{width: 360, maxHeight: '70vh', overflow: 'auto'}}>
          <Stack gap={3} padding={3}>
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Text size={1} weight="semibold">Config</Text>
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
                <Button
                  fontSize={1}
                  mode={state.global === 'stock' ? 'default' : 'ghost'}
                  onClick={() => setGlobalChoice('stock')}
                  padding={2}
                  text="Stock"
                  title="Show stock Studio: every design slot renders what Studio does today"
                />
              </Flex>
            </Stack>

            <Stack gap={2}>
              <Text muted size={0}>Stage (C1: how many dimensions)</Text>
              <Flex gap={1}>
                {([['open-beta', 'Open beta · 1 dimension'], ['ga', 'GA · all']] as const).map(([stage, text]) => (
                  <Button
                    fontSize={0}
                    key={stage}
                    mode={state.stage === stage ? 'default' : 'ghost'}
                    onClick={() => setStage(stage)}
                    padding={2}
                    text={text}
                    tone={state.stage === stage ? 'primary' : 'default'}
                  />
                ))}
              </Flex>
            </Stack>

            <Stack gap={2}>
              <Text muted size={0}>Variant dimensions shown in GA (C1 picker form)</Text>
              <Flex gap={1}>
                {([[null, 'All'], [1, '1 list'], [2, '2 columns'], [5, '5 rail']] as const).map(([limit, text]) => (
                  <Button
                    fontSize={0}
                    key={text}
                    mode={state.dimensionLimit === limit ? 'default' : 'ghost'}
                    disabled={state.stage === 'open-beta'}
                    onClick={() => setDimensionLimit(limit)}
                    padding={2}
                    text={text}
                    tone={state.dimensionLimit === limit ? 'primary' : 'default'}
                  />
                ))}
              </Flex>
            </Stack>

            <Stack gap={2}>
              <Text muted size={0}>Per component</Text>
              {COMPONENTS.filter((component) => component.options.length > 1).map((component) => {
                const active = resolveOption(component, state)
                const activeOption = component.options.find((option) => option.id === active)
                return (
                  <Stack gap={1} key={component.id}>
                    <Flex align="center" gap={2}>
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
                            tone={state.overrides[component.id] === option.id ? 'primary' : 'default'}
                          />
                        ))}
                      </Flex>
                    </Flex>
                    {activeOption && (
                      <Flex align="center" gap={2}>
                        <Badge fontSize={0} tone={STATUS_TONE[activeOption.status]}>{activeOption.status}</Badge>
                        <Text muted size={0}>{activeOption.label}</Text>
                      </Flex>
                    )}
                  </Stack>
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
            aria-label="Config"
            icon={ControlsIcon}
            onClick={() => setOpen(true)}
            radius="full"
            text={`Config · ${label}`}
            tone="primary"
          />
        </Card>
      )}
    </div>
  )
}

export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    <DocumentListItemOverrideProvider value={useRowOverride}>
      <PerspectiveProvider>
        <PerspectiveMenuExtensionProvider value={useOptionAExtension}>
          <DocumentPaneExtensionProvider value={useDocumentPaneOverride}>
            {props.renderDefault(props)}
            <FloatingOptions />
          </DocumentPaneExtensionProvider>
        </PerspectiveMenuExtensionProvider>
      </PerspectiveProvider>
    </DocumentListItemOverrideProvider>
  )
}
