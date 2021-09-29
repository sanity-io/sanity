import React, {CSSProperties, useEffect, useMemo, useState} from 'react'
import classNames from 'classnames'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/change-indicators'
import {isKeySegment, Marker, Path} from '@sanity/types'
import {
  PortableTextBlock,
  PortableTextEditor,
  RenderAttributes,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Markers} from '../../legacyParts'
import PatchEvent from '../../PatchEvent'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import styles from './BlockExtras.module.css'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'

type Props = {
  attributes: RenderAttributes
  block: PortableTextBlock
  blockActions?: Node
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
}
export default function BlockExtras(props: Props) {
  const {
    attributes,
    block,
    blockActions,
    isFullscreen,
    markers,
    onFocus,
    renderCustomMarkers,
  } = props
  const blockValidation = getValidationMarkers(markers)
  const errors = blockValidation.filter((mrkr) => mrkr.level === 'error')
  const warnings = blockValidation.filter((mrkr) => mrkr.level === 'warning')
  const empty = markers.length === 0 && !blockActions
  const content = useMemo(
    () => (
      <div className={styles.content}>
        {markers.length > 0 && (
          <div className={styles.markers}>
            <Markers
              className={styles.markers}
              markers={markers}
              scopedValidation={blockValidation}
              onFocus={onFocus}
              renderCustomMarkers={renderCustomMarkers}
            />
          </div>
        )}
        {blockActions && <div className={styles.blockActions}>{blockActions}</div>}
        {/* Make sure it gets proper height (has content). Insert an zero-width-space if empty */}
        {empty && <>&#8203;</>}
      </div>
    ),
    [blockActions, blockValidation, empty, markers, onFocus, renderCustomMarkers]
  )
  const showChangeIndicators = isFullscreen
  const contentWithChangeIndicators = useMemo(
    () => (
      <ChangeIndicatorWithProvidedFullPath
        className={styles.changeIndicator}
        compareDeep
        value={block}
        hasFocus={attributes.focused}
        path={[{_key: block._key}]}
      >
        {content}
      </ChangeIndicatorWithProvidedFullPath>
    ),
    [block, content, attributes]
  )
  const blockExtras = showChangeIndicators ? contentWithChangeIndicators : content
  const activeClassNames = useMemo(
    () =>
      classNames([
        styles.root,
        attributes.focused && styles.hasFocus,
        errors.length > 0 && styles.withError,
        warnings.length > 0 && !errors.length && styles.withWarning,
      ]),
    [attributes.focused, errors.length, warnings.length]
  )
  return <div className={activeClassNames}>{blockExtras}</div>
}

function getValidationMarkers(markers: Marker[]) {
  const validation = markers.filter((mrkr) => mrkr.type === 'validation')
  return validation.map((mrkr) => {
    if (mrkr.path.length <= 1) {
      return mrkr
    }
    const level = mrkr.level === 'error' ? 'errors' : 'warnings'
    return {
      ...mrkr,
      item: mrkr.item.cloneWithMessage(`Contains ${level}`),
    }
  })
}

const commonStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  userSelect: 'none',
  width: '100%',
}

const findBlockMarkers = (block: PortableTextBlock, markers: Marker[]): Marker[] =>
  markers.filter((marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key)

type BlockExtrasWithBlockActionsAndHeightProps = {
  attributes: RenderAttributes
  block: PortableTextBlock
  blockRef: React.RefObject<HTMLDivElement>
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  value: PortableTextBlock[] | undefined
}

export function BlockExtrasWrapper(props: BlockExtrasWithBlockActionsAndHeightProps): JSX.Element {
  const {
    attributes,
    block,
    blockRef,
    isFullscreen,
    markers,
    onChange,
    onFocus,
    renderBlockActions,
    renderCustomMarkers,
    value,
  } = props
  const editor = usePortableTextEditor()
  const blockMarkers = useMemo(() => findBlockMarkers(block, markers), [block, markers])
  const allowedDecorators = useMemo(
    () => PortableTextEditor.getPortableTextFeatures(editor).decorators.map((dec) => dec.value),
    [editor]
  )
  let actions = null
  if (renderBlockActions) {
    const RenderComponent = renderBlockActions
    if (block) {
      actions = (
        <RenderComponent
          block={block}
          value={value}
          set={createBlockActionPatchFn('set', block, onChange, allowedDecorators)}
          unset={
            createBlockActionPatchFn('unset', block, onChange, allowedDecorators) as () => void
          }
          insert={createBlockActionPatchFn('insert', block, onChange, allowedDecorators)}
        />
      )
    }
  }
  const [style, setStyle] = useState(commonStyle)
  useEffect(() => {
    if (blockRef.current) {
      const element = blockRef.current
      const top = element ? element.scrollTop + element.offsetTop : undefined
      const rect = element.getBoundingClientRect()
      const height = rect?.height
      setStyle({...commonStyle, height, top})
    }
  }, [blockRef])
  return (
    <div style={style} contentEditable={false}>
      <BlockExtras
        attributes={attributes}
        block={block}
        isFullscreen={isFullscreen}
        blockActions={actions}
        markers={blockMarkers}
        onFocus={onFocus}
        renderCustomMarkers={renderCustomMarkers}
      />
    </div>
  )
}
