import {JsonInspector} from '@rexxars/react-json-inspector'
import {LinkIcon} from '@sanity/icons'
import {Code, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import LRU from 'quick-lru'
import {type ReactNode} from 'react'
import {useDataset} from 'sanity'
import {IntentLink} from 'sanity/router'

import {
  codeFamilyVar,
  codeFontSizeVar,
  codeLineHeightVar,
  resultViewWrapper,
  space0Var,
  space2Var,
  space4HalfVar,
  space4Var,
  syntaxBooleanVar,
  syntaxConstantVar,
  syntaxNumberVar,
  syntaxPropertyVar,
  syntaxStringVar,
} from './ResultView.css'

const lru = new LRU({maxSize: 50000})

function ResultViewWrapper({children}: {children: ReactNode}) {
  const {color, font, space} = useThemeV2()
  const codeSize = font.code.sizes[2]

  return (
    <div
      className={resultViewWrapper}
      style={assignInlineVars({
        [codeFamilyVar]: font.code.family,
        [codeFontSizeVar]: `${codeSize.fontSize}px`,
        [codeLineHeightVar]: `${codeSize.lineHeight}px`,
        [space0Var]: `${rem(space[0])}`,
        [space2Var]: `${rem(space[2])}`,
        [space4Var]: `${rem(space[4])}`,
        [space4HalfVar]: `${rem(space[4] / 2)}`,
        [syntaxPropertyVar]: color.syntax.property,
        [syntaxConstantVar]: color.syntax.constant,
        [syntaxStringVar]: color.syntax.string,
        [syntaxBooleanVar]: color.syntax.boolean,
        [syntaxNumberVar]: color.syntax.number,
      })}
    >
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
