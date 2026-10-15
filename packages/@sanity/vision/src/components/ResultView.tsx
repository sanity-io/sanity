import {JsonInspector} from '@rexxars/react-json-inspector'
import {CopyIcon} from '@sanity/icons/Copy'
import {LinkIcon} from '@sanity/icons/Link'
import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import LRU from 'quick-lru'
import {createContext, type ReactNode, use, useMemo} from 'react'
import {useDataset} from 'sanity'
import {IntentLink} from 'sanity/router'

import {getAtKeypath} from '../util/getAtKeypath'
import {
  codeFamilyVar,
  codeFontSizeVar,
  codeLineHeightVar,
  copyableResult,
  copyNodeButton,
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

function ResultViewWrapper({children, copyable}: {children: ReactNode; copyable?: boolean}) {
  const {color, font, space} = useThemeV2()
  const codeSize = font.code.sizes[2]

  return (
    <div
      className={copyable ? `${resultViewWrapper} ${copyableResult}` : resultViewWrapper}
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

/** A copy button next to every property of the tree, copying the property's value */
export interface ResultViewCopy {
  /** Accessible name and tooltip of the buttons */
  label: string
  /** `keypath` is the property's dotted path from the root, empty for the root itself */
  onCopy: (value: unknown, keypath: string) => void
}

interface ResultLabelContextValue {
  data: unknown
  copy: ResultViewCopy | undefined
  /** `_id` and `_ref` values link to their documents when the result is the workspace's */
  linkDocuments: boolean
}

// The inspector takes one component for every label, so what it needs comes through context
const ResultLabelContext = createContext<ResultLabelContextValue | null>(null)

export function ResultView(props: {
  data: unknown
  datasetName: string
  copy?: ResultViewCopy
}): React.JSX.Element {
  const {data, datasetName, copy} = props
  const workspaceDataset = useDataset()
  const linkDocuments = workspaceDataset === datasetName
  const labelContext = useMemo(() => ({data, copy, linkDocuments}), [copy, data, linkDocuments])

  if (isRecord(data) || Array.isArray(data)) {
    return (
      <ResultViewWrapper copyable={Boolean(copy)}>
        <ResultLabelContext value={labelContext}>
          <JsonInspector
            data={data}
            search={false}
            isExpanded={isExpanded}
            onClick={toggleExpanded}
            interactiveLabel={copy || linkDocuments ? InteractiveLabel : undefined}
          />
        </ResultLabelContext>
      </ResultViewWrapper>
    )
  }

  return <Code language="json">{JSON.stringify(data)}</Code>
}

function InteractiveLabel(props: {value: string; isKey: boolean; keypath: string}) {
  const context = use(ResultLabelContext)
  if (props.isKey) {
    return context?.copy ? (
      <CopyNodeButton copy={context.copy} data={context.data} keypath={props.keypath} />
    ) : null
  }
  return context?.linkDocuments ? <DocumentEditLabel {...props} /> : null
}

function CopyNodeButton(props: {copy: ResultViewCopy; data: unknown; keypath: string}) {
  const {copy, data, keypath} = props
  return (
    <button
      aria-label={copy.label}
      className={copyNodeButton}
      data-testid="result-copy-node"
      onClick={(event) => {
        // The button sits in the line's label, which toggles the node when clicked
        event.preventDefault()
        event.stopPropagation()
        const found = getAtKeypath(data, keypath)
        if (found) copy.onCopy(found.value, keypath)
      }}
      title={copy.label}
      type="button"
    >
      <CopyIcon />
    </button>
  )
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
