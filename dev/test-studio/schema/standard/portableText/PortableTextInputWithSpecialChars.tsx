/* eslint-disable max-nested-callbacks */
import React, {
  MouseEvent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Button, Card, Grid, Popover, useClickOutside, useGlobalKeyDown, useTheme} from '@sanity/ui'
import {InputProps, Path, PortableTextInput, PortableTextInputProps, PortableTextSpan} from 'sanity'
import {
  EditorChange,
  HotkeyOptions,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import {isEqual} from 'lodash'

export interface BlackListLocation {
  matchText: string
  message: string
  offset: number
  path: Path
  span: PortableTextSpan
  level: 'error' | 'info' | 'warning'
}

const BlackListHighlighter = (props: PropsWithChildren & {level: BlackListLocation['level']}) => {
  const theme = useTheme()
  const level = 'level' in props && typeof props.level === 'string' ? props.level : undefined
  let color
  switch (level) {
    case 'info':
      color = theme.sanity.color.solid.positive.enabled.bg
      break
    case 'warning':
      color = theme.sanity.color.solid.caution.enabled.bg
      break
    default:
      color = theme.sanity.color.solid.critical.enabled.bg
  }
  return (
    <span style={{backgroundColor: color, backgroundBlendMode: 'multiply'}}>{props.children}</span>
  )
}

export const PortableTextInputWithSpecialCharacters = (props: InputProps) => {
  const portableTextInputProps = props as PortableTextInputProps
  const [showInsertCharacterMenu, setShowInsertCharacterMenu] = useState(false)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const [rangeDecorations, setRangeDecorations] = useState<RangeDecoration[]>([])

  const editorRef = useRef<PortableTextEditor | null>(null)

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()
    const range = selection?.getRangeAt(0)
    const rect = range?.getBoundingClientRect()
    setCursorRect(rect || null)
  }, [])

  const cursorElement = useMemo(() => {
    if (!cursorRect) {
      return null
    }
    return {
      getBoundingClientRect: () => {
        return cursorRect
      },
    }
  }, [cursorRect]) as HTMLElement

  const hotkeys: HotkeyOptions = useMemo(
    () => ({
      custom: {
        'ctrl+shift+-': () => {
          setShowInsertCharacterMenu(true)
        },
      },
    }),
    []
  )

  const closeMenu = useCallback(() => {
    setShowInsertCharacterMenu(false)
    if (editorRef.current) {
      PortableTextEditor.focus(editorRef.current)
    }
  }, [])

  useClickOutside(closeMenu, [popoverElement])

  useGlobalKeyDown((event) => {
    if (event.key === 'Escape') {
      closeMenu()
    }
  })

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, {
      passive: true,
    })

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  const handleInsertCharacterButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      closeMenu()
      if (editorRef.current && event.currentTarget.textContent) {
        const spanSchemaType = editorRef.current.schemaTypes.span
        PortableTextEditor.insertChild(editorRef.current, spanSchemaType, {
          text: event.currentTarget.textContent,
        })
        PortableTextEditor.focus(editorRef.current)
      }
    },
    [editorRef, closeMenu]
  )

  const setRangeDecorators = useCallback(() => {
    const decorations: RangeDecoration[] = []
    portableTextInputProps.members.forEach((member) => {
      if (member.kind !== 'item') {
        return
      }
      const validation = (member.kind === 'item' && member.item.validation) || []
      validation.forEach((item) => {
        const {metaData} = item
        if (metaData && typeof metaData === 'object' && 'blacklistMatchLocations' in metaData) {
          const locations = metaData.blacklistMatchLocations as BlackListLocation[]
          locations.forEach((location) => {
            const {offset, path, matchText} = location
            const relativePath = path.slice(props.path.length, path.length)
            const memberBlockValue = member.kind === 'item' ? member.item.value : undefined
            if (memberBlockValue) {
              const isRangeInvalid = (editor: PortableTextEditor) => {
                const [currentBlockValue] = PortableTextEditor.findByPath(
                  editor,
                  relativePath.slice(0, 1)
                )
                if (!isEqual(memberBlockValue, currentBlockValue)) {
                  return true
                }
                return false
              }
              decorations.push({
                isRangeInvalid,
                component: (componentProps: PropsWithChildren) => (
                  <BlackListHighlighter {...location}>
                    {componentProps.children}
                  </BlackListHighlighter>
                ),
                selection: {
                  anchor: {path: relativePath, offset},
                  focus: {path: relativePath, offset: offset + matchText.length},
                },
              })
            }
          })
        }
      })
    })
    setRangeDecorations(decorations)
    return decorations
  }, [portableTextInputProps.members, props.path.length])

  useEffect(() => {
    setRangeDecorators()
  }, [props.validation, setRangeDecorators])

  const handleEditorChange = useCallback((change: EditorChange, editor: PortableTextEditor) => {
    if (change.type === 'ready') {
      editorRef.current = editor
    }
  }, [])

  return (
    <>
      <Popover
        open={showInsertCharacterMenu}
        portal
        ref={setPopoverElement}
        referenceElement={cursorElement}
        content={
          <Card>
            <Grid gapX={1} rows={1} columns={3}>
              <Button onClick={handleInsertCharacterButtonClick} autoFocus>
                –
              </Button>
              <Button onClick={handleInsertCharacterButtonClick}>«</Button>
              <Button onClick={handleInsertCharacterButtonClick}>»</Button>
            </Grid>
          </Card>
        }
        padding={2}
        radius={2}
        shadow={1}
      />
      <PortableTextInput
        {...portableTextInputProps}
        onEditorChange={handleEditorChange}
        hotkeys={hotkeys}
        rangeDecorations={rangeDecorations}
      />
    </>
  )
}
