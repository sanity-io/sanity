import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'

import {
  applyPreset,
  deletePreset,
  exportPresets,
  importPresets,
  isMinePreset,
  isModified,
  presetSummary,
  resetOptions,
  savePresetAs,
  stepPreset,
  type State,
  updatePreset,
  usePresets,
} from './store'
import {type PresetDef} from './types'

const PURPLE = 'var(--card-badge-suggest-dot-color)'

/** The variant diamond, drawn small. */
function Diamond() {
  return (
    <svg aria-hidden="true" height={12} viewBox="0 0 12 12" width={12}>
      <path
        d="M6 1 11 6 6 11 1 6Z"
        fill={PURPLE}
        fillOpacity={0.35}
        stroke={PURPLE}
        strokeWidth={1}
      />
    </svg>
  )
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

function PresetRow(props: {preset: PresetDef; active: boolean; onPick: () => void}) {
  const {preset, active, onPick} = props
  return (
    <Card
      as="button"
      onClick={onPick}
      padding={2}
      radius={2}
      selected={active}
      style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
    >
      <Flex align="center" gap={2} style={{minHeight: 24}}>
        <Box flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {preset.name}
          </Text>
        </Box>
        <Text muted size={0}>
          {presetSummary(preset)}
        </Text>
      </Flex>
    </Card>
  )
}

/**
 * The Preset row: a pill that names the active preset (and says when the config differs), previous / next buttons
 * ([ and ] step too), Save as…, Update, and a picker with Shared (in the repo) and Mine (this browser) presets.
 */
export function PresetBar({state}: {state: State}) {
  const {shared, mine} = usePresets()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const root = useRef<HTMLDivElement | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const active = [...shared, ...mine].find((preset) => preset.id === state.preset)
  const modified = isModified(state)
  const activeIsMine = !!active && isMinePreset(active.id)

  // [ and ] step through presets, unless the user is typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === '[') stepPreset(-1)
      else if (event.key === ']') stepPreset(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close the picker on a click outside it.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [open])

  const close = () => {
    setOpen(false)
    setQuery('')
  }
  const startSave = () => {
    close()
    setName('')
    setError(null)
    setSaving(true)
  }
  const doSave = () => {
    const problem = savePresetAs(name)
    if (problem) setError(problem)
    else setSaving(false)
  }
  const matches = (preset: PresetDef) =>
    preset.name.toLowerCase().includes(query.trim().toLowerCase())
  const sharedShown = shared.filter(matches)
  const mineShown = mine.filter(matches)

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportPresets()], {type: 'application/json'}))
    const link = document.createElement('a')
    link.href = url
    link.download = 'design-presets.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  const upload = async (file: File | undefined) => {
    if (!file) return
    importPresets(await file.text())
  }

  return (
    <Flex align="center" gap={2} ref={root} style={{position: 'relative'}}>
      <Text
        muted
        size={0}
        style={{letterSpacing: '0.04em', textTransform: 'uppercase'}}
        weight="medium"
      >
        Preset
      </Text>

      {saving ? (
        <Flex align="center" gap={2}>
          <TextInput
            autoFocus
            fontSize={1}
            onChange={(event) => {
              setName(event.currentTarget.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') doSave()
              if (event.key === 'Escape') {
                event.stopPropagation()
                setSaving(false)
              }
            }}
            padding={3}
            placeholder="Name this preset"
            style={{width: 240}}
            value={name}
          />
          <Button
            fontSize={1}
            mode="default"
            onClick={doSave}
            padding={3}
            text="Save"
            tone="primary"
          />
          <Button
            fontSize={1}
            mode="bleed"
            onClick={() => setSaving(false)}
            padding={3}
            text="Cancel"
          />
          {error ? (
            <Text size={0} style={{color: 'var(--card-badge-critical-dot-color)'}}>
              {error}
            </Text>
          ) : null}
        </Flex>
      ) : (
        <>
          <Button
            aria-label="Previous preset"
            fontSize={1}
            mode="bleed"
            onClick={() => stepPreset(-1)}
            padding={2}
            style={{height: 25, width: 25}}
            text="‹"
            title="Previous preset ([)"
          />
          <Button
            aria-expanded={open}
            fontSize={1}
            iconRight={ChevronDownIcon}
            mode="ghost"
            onClick={() => setOpen((v) => !v)}
            padding={2}
            radius="full"
            style={{height: 25}}
            text={
              <Flex align="center" gap={2}>
                <Diamond />
                <span>{active ? active.name : 'No preset'}</span>
                {modified ? (
                  <span style={{alignItems: 'center', display: 'inline-flex', gap: 4}}>
                    <span
                      style={{
                        background: 'var(--card-badge-caution-dot-color)',
                        borderRadius: '50%',
                        height: 6,
                        width: 6,
                      }}
                    />
                    <span style={{opacity: 0.7}}>modified</span>
                  </span>
                ) : null}
              </Flex>
            }
          />
          <Button
            aria-label="Next preset"
            fontSize={1}
            mode="bleed"
            onClick={() => stepPreset(1)}
            padding={2}
            style={{height: 25, width: 25}}
            text="›"
            title="Next preset (])"
          />
          <Box flex={1} />
          <Button fontSize={1} mode="bleed" onClick={startSave} padding={2} text="Save as…" />
          <Button
            disabled={!modified || !activeIsMine}
            fontSize={1}
            mode="bleed"
            onClick={() => active && updatePreset(active.id)}
            padding={2}
            text="Update"
            title={
              !active
                ? 'Pick a preset to update'
                : !activeIsMine
                  ? 'Shared presets live in presets.json; use Save as…'
                  : modified
                    ? `Overwrite “${active.name}” with this config`
                    : 'Nothing to update: the config matches the preset'
            }
          />
        </>
      )}

      {open ? (
        <Card
          border
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              close()
            }
          }}
          radius={3}
          shadow={3}
          style={{
            left: 56,
            maxHeight: 340,
            overflow: 'auto',
            position: 'absolute',
            top: 32,
            width: 340,
            zIndex: 2,
          }}
        >
          <Stack gap={2} padding={2}>
            <TextInput
              autoFocus
              fontSize={1}
              onChange={(event) => setQuery(event.currentTarget.value)}
              padding={2}
              placeholder="Find a preset"
              value={query}
            />
            {sharedShown.length ? (
              <Stack gap={1}>
                <Box paddingX={2}>
                  <Text
                    muted
                    size={0}
                    style={{letterSpacing: '0.04em', textTransform: 'uppercase'}}
                    weight="medium"
                  >
                    Shared
                  </Text>
                </Box>
                {sharedShown.map((preset) => (
                  <PresetRow
                    active={preset.id === state.preset}
                    key={preset.id}
                    onPick={() => {
                      applyPreset(preset.id)
                      close()
                    }}
                    preset={preset}
                  />
                ))}
              </Stack>
            ) : null}
            {mineShown.length ? (
              <Stack gap={1}>
                <Box paddingX={2}>
                  <Text
                    muted
                    size={0}
                    style={{letterSpacing: '0.04em', textTransform: 'uppercase'}}
                    weight="medium"
                  >
                    Mine
                  </Text>
                </Box>
                {mineShown.map((preset) => (
                  <PresetRow
                    active={preset.id === state.preset}
                    key={preset.id}
                    onPick={() => {
                      applyPreset(preset.id)
                      close()
                    }}
                    preset={preset}
                  />
                ))}
              </Stack>
            ) : null}
            {!sharedShown.length && !mineShown.length ? (
              <Box padding={2}>
                <Text muted size={1}>
                  No preset matches.
                </Text>
              </Box>
            ) : null}
          </Stack>
          <Card borderTop padding={2}>
            <Stack gap={1}>
              <Button
                fontSize={1}
                justify="flex-start"
                mode="bleed"
                onClick={startSave}
                padding={2}
                text="Save current as new preset…"
              />
              {active ? (
                <>
                  <Button
                    disabled={!modified || !activeIsMine}
                    fontSize={1}
                    justify="flex-start"
                    mode="bleed"
                    onClick={() => {
                      updatePreset(active.id)
                      close()
                    }}
                    padding={2}
                    text={`Update ${active.name}`}
                  />
                  <Button
                    disabled={!modified}
                    fontSize={1}
                    justify="flex-start"
                    mode="bleed"
                    onClick={() => {
                      applyPreset(active.id)
                      close()
                    }}
                    padding={2}
                    text={`Reset to ${active.name}`}
                  />
                  {activeIsMine ? (
                    <Button
                      fontSize={1}
                      justify="flex-start"
                      mode="bleed"
                      onClick={() => {
                        deletePreset(active.id)
                        close()
                      }}
                      padding={2}
                      text="Delete"
                      tone="critical"
                    />
                  ) : null}
                </>
              ) : (
                <Button
                  fontSize={1}
                  justify="flex-start"
                  mode="bleed"
                  onClick={() => {
                    resetOptions()
                    close()
                  }}
                  padding={2}
                  text="Reset to defaults"
                />
              )}
              <Flex gap={1}>
                <Button
                  disabled={!mine.length}
                  fontSize={0}
                  mode="bleed"
                  onClick={download}
                  padding={2}
                  text="Export mine…"
                />
                <Button
                  fontSize={0}
                  mode="bleed"
                  onClick={() => fileInput.current?.click()}
                  padding={2}
                  text="Import…"
                />
              </Flex>
            </Stack>
          </Card>
        </Card>
      ) : null}
      <input
        accept="application/json"
        hidden
        onChange={(event) => {
          void upload(event.target.files?.[0])
          event.target.value = ''
        }}
        ref={fileInput}
        type="file"
      />
    </Flex>
  )
}
