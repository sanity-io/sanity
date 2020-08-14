import React, {useMemo, useCallback} from 'react'
import {Tooltip} from 'react-tippy'
import {
  HotkeyOptions,
  PortableTextBlock,
  PortableTextEditable,
  PortableTextFeatures,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderChildFunction,
  RenderDecoratorFunction,
  Type,
  EditorSelection,
  OnPasteFn,
  OnCopyFn
} from '@sanity/portable-text-editor'
import ErrorCircleIcon from 'part:@sanity/base/error-icon'
import Button from 'part:@sanity/components/buttons/default'
import ValidationList from 'part:@sanity/components/validation/list'
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
  onCopy?: OnCopyFn
  onCloseValidationResults: () => void
  onFocus: (Path) => void
  onFormBuilderChange: (change: PatchEvent) => void
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  onToggleValidationResults: () => void
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
  const {value, showValidationTooltip, markers, readOnly, isFullscreen} = props
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
    onCopy,
    onFocus,
    onFormBuilderChange,
    onPaste,
    onToggleFullscreen,
    onToggleValidationResults,
    portableTextFeatures,
    renderAnnotation,
    renderBlock,
    renderBlockActions,
    renderChild,
    renderCustomMarkers
  } = props

  const hasMarkers = markers.length > 0
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

  const validationList = useMemo(
    () => (
      <ValidationList
        markers={validation}
        showLink
        isOpen={showValidationTooltip}
        documentType={portableTextFeatures.types.portableText}
        onClose={onCloseValidationResults}
        onFocus={onFocus}
      />
    ),
    [validation, showValidationTooltip]
  )
  const renderBlockExtras = useCallback(
    () => (
      <BlockExtrasOverlay
        isFullscreen={isFullscreen}
        markers={markers}
        onFocus={onFocus}
        onChange={onFormBuilderChange}
        renderBlockActions={readOnly ? undefined : renderBlockActions}
        renderCustomMarkers={renderCustomMarkers}
        value={value}
      />
    ),
    [markers, isFullscreen]
  )
  const editor = useMemo(
    () => (
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
                html={validationList}
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
                onCopy={onCopy}
                onPaste={onPaste}
                placeholderText={value ? undefined : 'Empty'}
                renderAnnotation={renderAnnotation}
                renderBlock={renderBlock}
                renderChild={renderChild}
                renderDecorator={renderDecorator}
                selection={initialSelection}
                spellCheck={false} // TODO: from schema?
              />
            </div>
            <div className={styles.blockExtras}>{renderBlockExtras()}</div>
          </div>
        </div>
      </div>
    ),
    [initialSelection, isFullscreen, value, markers, readOnly, errors]
  )
  return editor
}

export default PortableTextSanityEditor
