import {JsonInspector} from '@rexxars/react-json-inspector'
import {LinkIcon} from '@sanity/icons/Link'
import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import LRU from 'quick-lru'
import {type CSSProperties, type ReactNode} from 'react'
import {useDataset} from 'sanity'
import {IntentLink} from 'sanity/router'

import styles from './ResultView.module.css'

const lru = new LRU({maxSize: 50000})

interface ResultViewWrapperStyle extends CSSProperties {
  '--vision-result-code-family': string
  '--vision-result-code-font-size': string
  '--vision-result-code-line-height': string
  '--vision-result-space-0': string
  '--vision-result-space-2': string
  '--vision-result-space-4': string
  '--vision-result-space-4-half': string
  '--vision-result-syntax-property': string
  '--vision-result-syntax-constant': string
  '--vision-result-syntax-string': string
  '--vision-result-syntax-boolean': string
  '--vision-result-syntax-number': string
}

function ResultViewWrapper({children}: {children: ReactNode}) {
  const {color, font, space} = useThemeV2()
  const codeSize = font.code.sizes[2]
  const style: ResultViewWrapperStyle = {
    '--vision-result-code-family': font.code.family,
    '--vision-result-code-font-size': `${codeSize.fontSize}px`,
    '--vision-result-code-line-height': `${codeSize.lineHeight}px`,
    '--vision-result-space-0': `${rem(space[0])}`,
    '--vision-result-space-2': `${rem(space[2])}`,
    '--vision-result-space-4': `${rem(space[4])}`,
    '--vision-result-space-4-half': `${rem(space[4] / 2)}`,
    '--vision-result-syntax-property': color.syntax.property,
    '--vision-result-syntax-constant': color.syntax.constant,
    '--vision-result-syntax-string': color.syntax.string,
    '--vision-result-syntax-boolean': color.syntax.boolean,
    '--vision-result-syntax-number': color.syntax.number,
  }

  return (
    <div className={styles.resultViewWrapper} style={style}>
      {children}
    </div>
  )
}

export function ResultView(props: {data: unknown; datasetName: string}): React.JSX.Element {
  const {data, datasetName} = props
  const workspaceDataset = useDataset()

  if (isRecord(data) || Array.isArray(data)) {
    return (
      <ResultViewWrapper>
        <JsonInspector
          data={data}
          search={false}
          isExpanded={isExpanded}
          onClick={toggleExpanded}
          interactiveLabel={workspaceDataset === datasetName ? DocumentEditLabel : undefined}
        />
      </ResultViewWrapper>
    )
  }

  return <Code language="json">{JSON.stringify(data)}</Code>
}

function DocumentEditLabel(props: {value: string; isKey: boolean; keypath: string}) {
  if (props.isKey || (!props.keypath.endsWith('_id') && !props.keypath.endsWith('_ref'))) {
    return null
  }

  return (
    <IntentLink intent="edit" params={{id: props.value}}>
      <LinkIcon />
    </IntentLink>
  )
}

function isExpanded(keyPath: string, value: unknown): boolean {
  const depthLimit = 4
  const cached = lru.get(keyPath) as boolean | undefined

  if (typeof cached === 'boolean') {
    return cached
  }

  const segments = keyPath.split('.', depthLimit)
  if (segments.length === depthLimit) {
    return false
  }

  if (Array.isArray(value)) {
    return true
  }

  return isRecord(value) && !segments.some((key) => isArrayKeyOverLimit(key))
}

function toggleExpanded(event: {path: string}): void {
  const {path} = event
  const current = lru.get(path)

  if (current === undefined) {
    // something is wrong
    return
  }

  lru.set(path, !current)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const numeric = /^\d+$/
function isArrayKeyOverLimit(segment: string, limit = 10) {
  return numeric.test(segment) && parseInt(segment, 10) > limit
}
