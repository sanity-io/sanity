import {Card, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {clsx} from 'clsx'
import {
  type ComponentProps,
  type ElementType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {Box, type BoxProps} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {pathToString} from '../../paths/helpers'
import {type FieldChangeNode} from '../../types'
import {codeWrapper, meta} from './DiffInspectWrapper.css'
import {FromToArrow} from './FromToArrow'

/** @internal */
export interface DiffInspectWrapperProps {
  children: ReactNode
  change: FieldChangeNode
  as?: ElementType
}

// Kept as a component (rather than `as="pre"`) so Card does not see `data-as="pre"` and apply its
// `font: inherit` rule, matching the previous styled.pre rendering.
function CodeWrapper(props: ComponentProps<'pre'>) {
  const {className, ...rest} = props

  return <pre {...rest} className={clsx(codeWrapper, className)} />
}

/** @internal */
export function DiffInspectWrapper(
  props: DiffInspectWrapperProps & Omit<BoxProps, 'as'>,
): React.JSX.Element {
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
  <Box padding={3} display="inline-block" className={meta}>
    <Text muted size={1} weight="medium">
      {title}
    </Text>
  </Box>
)

function DiffInspector({change}: {change: FieldChangeNode}): React.JSX.Element | null {
  const {t} = useTranslation()
  return (
    <Stack gap={3}>
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
