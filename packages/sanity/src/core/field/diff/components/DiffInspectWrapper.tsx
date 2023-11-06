import {Box, BoxProps, Card, Code, Label, Stack} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import styled, {type ExecutionProps} from 'styled-components'
import {useTranslation} from '../../../i18n'
import {pathToString} from '../../paths'
import type {FieldChangeNode} from '../../types'
import {FromToArrow} from './FromToArrow'

/** @internal */
export interface DiffInspectWrapperProps {
  children: React.ReactNode
  change: FieldChangeNode
  as?: ExecutionProps['as']
}

const CodeWrapper = styled.pre`
  overflow-x: auto;
  position: relative;
`

const Meta = styled.div`
  position: absolute;
  top: 0;
  right: 0;
`

/** @internal */
export function DiffInspectWrapper(props: DiffInspectWrapperProps & BoxProps): React.ReactElement {
  const {children, as, change, ...restProps} = props
  const isHovering = useRef(false)
  const [isInspecting, setIsInspecting] = useState(false)

  const toggleInspect = useCallback(() => setIsInspecting((state) => !state), [setIsInspecting])
  const handleMouseEnter = useCallback(() => (isHovering.current = true), [])
  const handleMouseLeave = useCallback(() => (isHovering.current = false), [isHovering])

  useEffect(() => {
    function onKeyDown(evt: KeyboardEvent) {
      const {metaKey, key} = evt
      if (metaKey && key === 'i' && isHovering.current) {
        toggleInspect()
      }
    }

    window.addEventListener('keydown', onKeyDown, false)
    return () => window.removeEventListener('keydown', onKeyDown, false)
  }, [toggleInspect])

  return (
    <Box as={as} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...restProps}>
      {isInspecting ? <DiffInspector change={change} /> : children}
    </Box>
  )
}

const MetaLabel = ({title}: {title: string}) => (
  <Box padding={3} display="inline-block" as={Meta}>
    <Label size={1} muted>
      {title}
    </Label>
  </Box>
)

function DiffInspector({change}: {change: FieldChangeNode}): React.ReactElement | null {
  const {t} = useTranslation()
  return (
    <Stack space={3}>
      <Card padding={3} tone="transparent" as={CodeWrapper} radius={1}>
        <MetaLabel title={t('changes.inspector.meta-label')} />
        <Code language="json" size={1}>
          {printMeta({
            path: pathToString(change.path),
            fromIndex: change.itemDiff?.fromIndex,
            toIndex: change.itemDiff?.toIndex,
            hasMoved: change.itemDiff?.hasMoved,
            action: change.diff.action,
            isChanged: change.diff.isChanged,
          })}
        </Code>
      </Card>
      <Card as={CodeWrapper} tone="critical" padding={3} radius={1}>
        <MetaLabel title={t('changes.inspector.from-label')} />
        <Code language="json" size={1}>
          {jsonify(change.diff.fromValue)}
        </Code>
      </Card>
      <Card>
        <FromToArrow direction="down" align="center" />
      </Card>
      <Card as={CodeWrapper} tone="positive" padding={3} radius={1}>
        <MetaLabel title={t('changes.inspector.to-label')} />
        <Code language="json" size={1}>
          {jsonify(change.diff.toValue)}
        </Code>
      </Card>
    </Stack>
  )
}

function jsonify(value: unknown) {
  if (typeof value === 'undefined') {
    return 'undefined'
  }

  return JSON.stringify(value, null, 2)
}

function printMeta(keys: Record<string, unknown>) {
  const lines: string[] = []

  Object.entries(keys).forEach(([key, value]) => {
    if (typeof value !== 'undefined' && value !== null) {
      lines.push(`${key}: ${value}`)
    }
  })

  return lines.join('\n')
}
