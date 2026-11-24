import {JsonInspector} from '@rexxars/react-json-inspector'
import {LinkIcon} from '@sanity/icons/Link'
import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import LRU from 'quick-lru'
import {createContext, type CSSProperties, type ReactNode, use, useMemo} from 'react'
import {useDataset} from 'sanity'
import {IntentLink} from 'sanity/router'

import {getAtKeypath} from '../util/getAtKeypath'
import * as styles from './ResultView.module.css'
import {ResultViewRowActions} from './ResultViewRowActions'

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

function ResultViewWrapper({children, rowActions}: {children: ReactNode; rowActions: boolean}) {
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
    <div
      className={
        rowActions
          ? `${styles.resultViewWrapper} ${styles.withRowActions}`
          : styles.resultViewWrapper
      }
      style={style}
    >
      {children}
    </div>
  )
}

/**
 * A copy button after every property of the tree, copying the property's value. With it, `_id`
 * and `_ref` values get an edit button next to it instead of the inline link.
 */
export interface ResultViewCopy {
  /** Accessible name and tooltip of the buttons */
  label: string
  /**
   * `keypath` is the property's dotted path from the root, empty for the root itself. Resolves
   * whether the value was copied.
   */
  onCopy: (value: unknown, keypath: string) => Promise<boolean>
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
      <ResultViewWrapper rowActions={Boolean(copy)}>
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

interface InteractiveLabelProps {
  value: string
  originalValue: unknown
  isKey: boolean
  keypath: string
}

function InteractiveLabel(props: InteractiveLabelProps) {
  const context = use(ResultLabelContext)
  if (!context) return null
  if (context.copy) return <RowActionsLabel {...props} context={context} copy={context.copy} />
  return context.linkDocuments ? <DocumentEditLabel {...props} /> : null
}

/**
 * The inspector renders a label after a line's key, and after its value when the value is a
 * primitive. The actions follow a primitive's value, and an object's or array's summary: they sit
 * in its key's label, which the stylesheet moves to the end of the line. The root has the result's
 * own Copy button instead.
 */
function RowActionsLabel(
  props: InteractiveLabelProps & {context: ResultLabelContextValue; copy: ResultViewCopy},
) {
  const {originalValue, isKey, keypath, context, copy} = props
  const target = isKey && keypath ? getAtKeypath(context.data, keypath) : undefined
  const composite = typeof target?.value === 'object' && target.value !== null
  if (isKey ? !composite : !keypath) return null

  const value = isKey ? target?.value : originalValue
  const editId =
    !isKey &&
    context.linkDocuments &&
    typeof originalValue === 'string' &&
    isDocumentIdPath(keypath)
      ? originalValue
      : undefined
  return (
    <ResultViewRowActions
      copyLabel={copy.label}
      editId={editId}
      onCopy={() => copy.onCopy(value, keypath)}
    />
  )
}

function isDocumentIdPath(keypath: string): boolean {
  const key = keypath.slice(keypath.lastIndexOf('.') + 1)
  return key === '_id' || key === '_ref'
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
