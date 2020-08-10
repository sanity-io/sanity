import React from 'react'
import {Tooltip} from 'react-tippy'
import {
  HotkeyOptions,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditable,
  PortableTextFeatures,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderChildFunction,
  RenderDecoratorFunction,
  Type,
  EditorSelection
} from '@sanity/portable-text-editor'
import ErrorCircleIcon from 'part:@sanity/base/error-icon'
import Button from 'part:@sanity/components/buttons/default'
import ValidationList from 'part:@sanity/components/validation/list'
import {Subject} from 'rxjs'
import PatchEvent from '../../PatchEvent'
import {Marker} from '../../typedefs'
import styles from './PortableTextInput.css'
import Toolbar from './Toolbar/Toolbar'
import {ExpandCollapseButton} from './expandCollapseButton'
import BlockExtrasOverlay from './BlockExtrasOverlay'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import Decorator from './Text/Decorator'

type Props = {
  initialSelection?: EditorSelection
  isFullscreen: boolean
  markers: Array<Marker>
  onBlur: () => void
  onCloseValidationResults: () => void
  onFocus: (Path) => void
  onFormBuilderChange: (change: PatchEvent) => void
  onPaste?: (arg0: {
    event: React.SyntheticEvent
    path: []
    type: Type
    value: PortableTextBlock[] | undefined
  }) => {
    insert?: PortableTextBlock[]
    path?: []
  }
  onToggleFullscreen: () => void
  onToggleValidationResults: () => void
  patche$: Subject<EditorPatch>
  portableTextFeatures: PortableTextFeatures
  readOnly: boolean | null
  renderAnnotation: RenderAnnotationFunction
  renderBlock: RenderBlockFunction
  renderBlockActions?: RenderBlockActions
  renderChild: RenderChildFunction
  renderCustomMarkers?: RenderCustomMarkers
  showValidationTooltip: boolean
  value: PortableTextBlock[] | undefined
}

const renderDecorator: RenderDecoratorFunction = (mark, mType, attributes, defaultRender) => {
  return <Decorator mark={mark}>{defaultRender()}</Decorator>
}

// eslint-disable-next-line complexity
function PortableTextSanityEditor(props: Props) {
  const {value, showValidationTooltip, markers, readOnly, isFullscreen, patche$} = props
  const hotkeys: HotkeyOptions = {
    marks: {
      'mod+b': 'strong',
      'mod+i': 'em',
      'mod+´': 'code'
    },
    custom: {
      'mod+enter': props.onToggleFullscreen
    }
  }
  const {
    initialSelection,
    onCloseValidationResults,
    onFocus,
    onFormBuilderChange,
    onToggleFullscreen,
    onToggleValidationResults,
    portableTextFeatures,
    renderAnnotation,
    renderBlock,
    renderBlockActions,
    renderChild,
    renderCustomMarkers
  } = props

  const hasMarkers = markers.filter(marker => marker.path.length > 0).length > 0

  const scClassNames = [
    styles.scrollContainer,
    ...(renderBlockActions || hasMarkers ? [styles.hasBlockExtras] : [])
  ].join(' ')
  const editorWrapperClassNames = [styles.editorWrapper].join(' ')
  const editorClassNames = [
    styles.editor,
    ...(renderBlockActions || hasMarkers ? [styles.hasBlockExtras] : [])
  ].join(' ')

  const validation = markers.filter(marker => marker.type === 'validation')
  const errors = validation.filter(marker => marker.level === 'error')
  const warnings = validation.filter(marker => marker.level === 'warning')

  return (
    <div className={styles.editorBox}>
      <div className={styles.header}>
        <div className={styles.toolbarContainer}>
          <Toolbar
            isFullscreen={isFullscreen}
            hotkeys={hotkeys}
            onFocus={onFocus}
            renderBlock={renderBlock}
            readOnly={readOnly}
          />
        </div>
        {isFullscreen && (errors.length > 0 || warnings.length > 0) && (
          <div className={styles.validationContainer}>
            <Tooltip
              arrow
              duration={100}
              html={
                <ValidationList
                  markers={validation}
                  showLink
                  isOpen={showValidationTooltip}
                  documentType={portableTextFeatures.types.portableText}
                  onClose={onCloseValidationResults}
                  onFocus={onFocus}
                />
              }
              interactive
              onRequestClose={onCloseValidationResults}
              open={showValidationTooltip}
              position="bottom"
              style={{padding: 0}}
              theme="light"
              trigger="click"
            >
              <Button
                color="danger"
                icon={ErrorCircleIcon}
                kind="simple"
                onClick={onToggleValidationResults}
                padding="small"
              />
            </Tooltip>
          </div>
        )}

        <div className={styles.fullscreenButtonContainer}>
          <ExpandCollapseButton
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
          />
        </div>
      </div>
      <div className={scClassNames}>
        <div className={editorWrapperClassNames}>
          <div className={editorClassNames}>
            <PortableTextEditable
              hotkeys={hotkeys}
              placeholderText={value ? undefined : 'Empty'}
              incomingPatche$={patche$.asObservable()}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderChild={renderChild}
              renderDecorator={renderDecorator}
              selection={initialSelection}
              spellCheck={false} // TODO: from schema?
            />
          </div>
          <div className={styles.blockExtras}>
            <BlockExtrasOverlay
              isFullscreen={isFullscreen}
              markers={markers}
              onFocus={onFocus}
              onChange={onFormBuilderChange}
              renderBlockActions={readOnly ? undefined : renderBlockActions}
              renderCustomMarkers={renderCustomMarkers}
              value={value}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortableTextSanityEditor
