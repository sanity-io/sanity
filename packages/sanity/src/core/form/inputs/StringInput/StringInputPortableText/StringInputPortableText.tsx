import {
  type EditorConfig,
  type EditorEmittedEvent,
  EditorProvider,
  type EditorSelection,
  PortableTextEditable,
  type PortableTextObject,
  type RangeDecoration,
  useEditor,
} from '@portabletext/editor'
import {EventListenerPlugin, OneLinePlugin} from '@portabletext/editor/plugins'
import {type PortableTextBlock} from '@portabletext/react'
import {isPortableTextBlock} from '@portabletext/toolkit'
import {type Diff, type StringDiffSegment} from '@sanity/diff'
import {applyPatches, parsePatch} from '@sanity/diff-match-patch'
import {type Path} from '@sanity/types'
import {type BadgeTone, type ButtonTone, Card, useArrayProp, useRootTheme} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {
  type ComponentType,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {styled} from 'styled-components'

import {getReleaseTone} from '../../../../releases/util/getReleaseTone'
import {useWorkspace} from '../../../../studio/workspace'
import {set, unset} from '../../../patch/patch'
import {type ProvenanceDiffAnnotation} from '../../../store/types/diff'
import {type ComputeDiff} from '../../../store/types/nodes'
import {type StringInputProps} from '../../../types'
import {UpdateReadOnlyPlugin} from '../../PortableText/PortableTextInput'
import {
  inputStyles,
  responsiveInputPaddingStyle,
  textInputBaseStyle,
  textInputFontSizeStyle,
  type TextInputInputStyleProps,
  textInputRepresentationStyle,
  type TextInputRepresentationStyleProps,
  type TextInputResponsivePaddingStyleProps,
  textInputRootStyle,
} from './styles'

const INVALID_CLASS_NAME = 'invalid'

const StyledRoot = styled.div`
  flex: 1;
  min-width: 0;
  display: block;
  position: relative;
`

const StyledInput = styled(PortableTextEditable)<
  TextInputInputStyleProps & TextInputResponsivePaddingStyleProps
>`
  ${textInputRootStyle}
  ${textInputBaseStyle}
  ${responsiveInputPaddingStyle}
  ${textInputFontSizeStyle}
  ${inputStyles}
`

const StyledEditorRepresentation = styled(Card)<TextInputRepresentationStyleProps>(
  textInputRepresentationStyle,
)

interface StyledSegmentProps {
  $tone?: ButtonTone
}

const StyledSegment = styled.span<StyledSegmentProps>`
  ${({theme, $tone}) => {
    if (typeof $tone === 'undefined') {
      return undefined
    }

    const {color} = getTheme_v2(theme)

    return {
      backgroundColor: color.button.bleed[$tone]?.pressed?.bg,
      color: color.button.bleed[$tone]?.pressed?.fg,
    }
  }}
`

const StyledPlaceholder = styled.span<TextInputResponsivePaddingStyleProps>`
  ${responsiveInputPaddingStyle}
`

type InputOrigin = 'optimistic' | 'definitive'

/**
 * This string input implementation is powered by the Portable Text Editor. It's used when inline
 * diffs are switched on, but this will likely expand in the future to support features such as
 * presence carets, and eventually become the default/only input component.
 *
 * @hidden
 * @beta
 */
export function StringInputPortableText(props: StringInputProps) {
  const {advancedVersionControl} = useWorkspace()
  const {
    elementProps,
    onChange,
    value: definitiveValue,
    __unstable_diff: definitiveDiff,
    __unstable_computeDiff: computeDiff,
  } = props
  const {onFocus, onBlur} = elementProps

  const {diff, rangeDecorations, onOptimisticChange} = useOptimisticDiff({
    definitiveValue,
    definitiveDiff,
    computeDiff,
  })

  const handleEditorEvent = useCallback(
    (event: EditorEmittedEvent) => {
      if (event.type === 'focused') {
        onFocus(event.event)
        return
      }

      if (event.type === 'blurred') {
        onBlur(event.event)
        return
      }

      // The patch event occurs at the same time as user input, so it can be used to perform actions
      // in tandem with the user's input. e.g. as soon as they type.
      //
      // On patch, set the optimistic value used to create an optimistic diff that can be rendered
      // immediately to reflect the user's input that has not yet been committed.
      if (
        event.type === 'patch' &&
        event.patch.type === 'diffMatchPatch' &&
        event.patch.origin === 'local'
      ) {
        onOptimisticChange(event.patch.value)
        return
      }

      // The mutation event occurs after user input (there is a debounce or throttle period), so it
      // can be used to perform actions that are lower priority than rendering the user's input.
      //
      // On mutation, execute the relevant patches to commit the user's input.
      if (event.type === 'mutation') {
        const value = unpackageValue(event.value)
        const valueRemainsUndefined = typeof definitiveValue === 'undefined' && value === ''
        const valueBecomesUndefined = typeof definitiveValue !== 'undefined' && value === ''
        const valueHasChanged = value !== definitiveValue && !valueRemainsUndefined

        if (!valueHasChanged) {
          return
        }

        if (valueBecomesUndefined) {
          onChange(unset())
          return
        }

        onChange(set(value))
      }
    },
    [onFocus, onBlur, onOptimisticChange, definitiveValue, onChange],
  )

  const initialConfig = useRef<EditorConfig>({
    initialValue: packageValue(props.value),
    readOnly: props.readOnly ?? false,
    schema: {
      name: 'pteTransformer',
      type: 'array',
      of: [
        {
          type: 'block',
        },
      ],
    },
  })

  const rootTheme = useRootTheme()
  const fontSize = useArrayProp(2)
  const padding = useArrayProp(3)
  const radius = useArrayProp(2)
  const space = useArrayProp(3)

  const diffSegments = diff.type === 'string' ? diff.segments : undefined

  // Range decorations are used to render deleted diff segments. However, rendering a range
  // decoration necessitates that a range actually exists. In the instance that the entire value has
  // been deleted, there is no range to decorate.
  //
  // Instead, the placeholder is used to render the delete diff segment when the entire value has been
  // deleted.
  const renderPlaceholder = useCallback(() => {
    const isEntireValuedDeleted = diff.fromValue && diff.toValue === ''

    if (isEntireValuedDeleted && diffSegments) {
      return (
        <StyledPlaceholder $fontSize={fontSize} $space={space} $padding={padding}>
          <DeletedSegment segment={diffSegments[0]} />
        </StyledPlaceholder>
      )
    }

    return null
  }, [diff.fromValue, diff.toValue, diffSegments, fontSize, space, padding])

  return (
    <StyledRoot>
      <EditorProvider initialConfig={initialConfig.current}>
        <OneLinePlugin />
        <EventListenerPlugin on={handleEditorEvent} />
        <UpdateValuePlugin value={props.value} />
        <UpdateReadOnlyPlugin readOnly={props.readOnly ?? false} />
        <StyledInput
          className={props.validationError ? INVALID_CLASS_NAME : undefined}
          renderPlaceholder={advancedVersionControl.enabled ? renderPlaceholder : undefined}
          rangeDecorations={advancedVersionControl.enabled ? rangeDecorations : undefined}
          $fontSize={fontSize}
          $space={space}
          $padding={padding}
          $scheme={rootTheme.scheme}
          $tone={rootTheme.tone}
          data-scheme={rootTheme.scheme}
          data-tone={rootTheme.tone}
          data-testid="string-input-portable-text"
        />
      </EditorProvider>
      <StyledEditorRepresentation
        radius={radius}
        $scheme={rootTheme.scheme}
        $tone={rootTheme.tone}
        data-scheme={rootTheme.scheme}
        data-tone={rootTheme.tone}
        data-border
      />
    </StyledRoot>
  )
}

const ROOT_PATH: Path = [{_key: 'root'}, 'children', {_key: 'root'}]

function packageValue(value: string | undefined) {
  return [
    {
      _type: 'block',
      _key: 'root',
      children: [
        {
          _type: 'span',
          _key: 'root',
          text: value ?? '',
        },
      ],
    },
  ] satisfies PortableTextBlock[]
}

function unpackageValue(value: (PortableTextBlock | PortableTextObject)[] = []): string {
  return (
    value
      .filter((block) => isPortableTextBlock(block))
      .find(({_key}) => _key === 'root')
      ?.children?.find(({_key}) => _key === 'root')?.text ?? ''
  )
}

function rangeDecorationSelection(anchorOffset: number, focusOffset: number): EditorSelection {
  return {
    anchor: {
      path: ROOT_PATH,
      offset: anchorOffset,
    },
    focus: {
      path: ROOT_PATH,
      offset: focusOffset,
    },
  }
}

/**
 * `EditorProvider` doesn't have a `value` prop. Instead, this custom PTE
 * plugin listens for the prop change and sends an `update value` event to the
 * editor.
 */
function UpdateValuePlugin(props: {value: string | undefined}) {
  const editor = useEditor()

  useEffect(() => {
    editor.send({
      type: 'update value',
      value: packageValue(props.value),
    })
  }, [editor, props.value])

  return null
}

interface SegmentProps {
  segment: StringDiffSegment<ProvenanceDiffAnnotation>
}

const DeletedSegment: ComponentType<SegmentProps> = ({segment}) => (
  <StyledSegment
    as="del"
    data-text={segment.text}
    contentEditable={false}
    aria-hidden
    inert
    $tone="critical"
  />
)

// const InsertedSegment: RangeDecoration['component'] = ({children}) => (

const InsertedSegment: ComponentType<PropsWithChildren<SegmentProps>> = ({children, segment}) => {
  return (
    <StyledSegment as="ins" $tone={segmentTone(segment)}>
      {children}
    </StyledSegment>
  )
}

interface ComputeRangeDecorationsOptions {
  diff: Diff<ProvenanceDiffAnnotation>
  mapPayload?: (payload: Record<string, unknown>) => Record<string, unknown>
}

function computeRangeDecorations({
  diff,
  mapPayload = (payload) => payload,
}: ComputeRangeDecorationsOptions): RangeDecoration[] {
  if (diff.type !== 'string') {
    return []
  }

  const segments = diff?.segments ?? []

  const {rangeDecorations} = segments.reduce<{
    rangeDecorations: RangeDecoration[]
    position: number
  }>(
    (state, segment, index) => {
      const previousSegment = segments.at(index - 1)
      const previousDecoration = state.rangeDecorations.at(-1)

      // Overlapping ranges cannot be given separate decorations. String diffs are calculated
      // such that this is only a concern if an added segment immediately proceeds a removed
      // segment; in this scenario, the removed segment decorates the starting position of the
      // added segment. To solve this problem, the removed and added decorations are merged.
      if (
        segment.action === 'added' &&
        previousDecoration?.payload?.action === 'removed' &&
        typeof previousSegment !== 'undefined'
      ) {
        const isOverlapping = previousDecoration?.selection?.anchor?.offset === state.position

        if (isOverlapping) {
          state.rangeDecorations.splice(state.rangeDecorations.length - 1, 1, {
            selection: rangeDecorationSelection(
              state.position,
              state.position + segment.text.length,
            ),
            component: ({children}) => {
              return (
                <span>
                  <previousDecoration.component />
                  <InsertedSegment segment={segment}>{children}</InsertedSegment>
                </span>
              )
            },
            payload: mapPayload({
              id: segmentId(
                previousDecoration?.payload?.action,
                previousSegment.text,
                'added',
                segment.text,
              ),
              action: 'merged',
            }),
          })

          state.position += segment.text.length
          return state
        }
      }

      if (segment.action === 'added') {
        state.rangeDecorations.push({
          selection: rangeDecorationSelection(state.position, state.position + segment.text.length),
          component: (props) => <InsertedSegment segment={segment} {...props} />,
          payload: mapPayload({
            id: segmentId('added', segment.text),
            action: segment.action,
          }),
        })

        state.position += segment.text.length
        return state
      }

      if (segment.action === 'removed') {
        state.rangeDecorations.push({
          selection: rangeDecorationSelection(state.position, state.position),
          component: () => <DeletedSegment segment={segment} />,
          payload: mapPayload({
            id: segmentId('removed', segment.text),
            action: segment.action,
          }),
        })

        return state
      }

      if (segment.action === 'unchanged') {
        state.position += segment.text.length
        return state
      }

      return state
    },
    {
      position: 0,
      rangeDecorations: [],
    },
  )

  return rangeDecorations
}

function segmentTone(segment: StringDiffSegment<ProvenanceDiffAnnotation>): BadgeTone | undefined {
  if (
    segment.action !== 'unchanged' &&
    typeof segment.annotation.provenance.bundle !== 'undefined'
  ) {
    return getReleaseTone(segment.annotation.provenance.bundle)
  }

  return undefined
}

interface OptimisticDiffOptions {
  definitiveValue: string | undefined
  definitiveDiff: Diff<ProvenanceDiffAnnotation>
  computeDiff: ComputeDiff<ProvenanceDiffAnnotation>
}

interface OptimisticDiffApi {
  diff: Diff<ProvenanceDiffAnnotation>
  rangeDecorations: RangeDecoration[]
  onOptimisticChange: (value: string) => void
}

function useOptimisticDiff({
  definitiveValue,
  definitiveDiff,
  computeDiff,
}: OptimisticDiffOptions): OptimisticDiffApi {
  const [optimisticValue, setOptimisticValue] = useState(definitiveValue)
  const [currentSignal, setCurrentSignal] = useState<InputOrigin>('definitive')
  const optimisticDiff = useMemo(() => computeDiff(optimisticValue), [computeDiff, optimisticValue])

  const diffsBySignal: Record<InputOrigin, Diff<ProvenanceDiffAnnotation>> = {
    optimistic: optimisticDiff,
    definitive: definitiveDiff,
  }

  const diff = diffsBySignal[currentSignal]

  const onOptimisticChange = useCallback(
    (value: string) => {
      const [nextOptimisticValue] = applyPatches(parsePatch(value), optimisticValue ?? '')
      setOptimisticValue(nextOptimisticValue)
      setCurrentSignal('optimistic')
    },
    [optimisticValue],
  )

  useEffect(() => {
    setCurrentSignal('definitive')
    // Ensure the optimistic value is synced with the definitive value.
    setOptimisticValue(definitiveValue)
  }, [definitiveValue])

  const rangeDecorations = useMemo(
    () =>
      computeRangeDecorations({
        diff,
        mapPayload: (payload) => ({
          ...payload,
          // Including the current signal in the payload ensures that the range decorations are
          // rerendered when the signal changes.
          currentSignal,
        }),
      }),
    [diff, currentSignal],
  )

  return {
    diff,
    rangeDecorations,
    onOptimisticChange,
  }
}

function segmentId(...path: string[]): string {
  return path.join('.')
}
