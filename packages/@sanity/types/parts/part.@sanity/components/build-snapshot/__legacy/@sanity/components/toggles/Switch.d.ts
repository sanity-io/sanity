import React from 'react'
import {Marker} from '_self_'
interface SwitchProps {
  label?: string
  description?: string
  markers?: Marker[]
  readOnly?: boolean
}
declare const _default: React.ForwardRefExoticComponent<
  Pick<
    SwitchProps &
      Pick<
        React.HTMLProps<HTMLInputElement>,
        | 'value'
        | 'children'
        | 'ref'
        | 'cite'
        | 'data'
        | 'form'
        | 'label'
        | 'slot'
        | 'span'
        | 'style'
        | 'summary'
        | 'title'
        | 'pattern'
        | 'size'
        | 'accept'
        | 'acceptCharset'
        | 'action'
        | 'allowFullScreen'
        | 'allowTransparency'
        | 'alt'
        | 'as'
        | 'async'
        | 'autoComplete'
        | 'autoFocus'
        | 'autoPlay'
        | 'capture'
        | 'cellPadding'
        | 'cellSpacing'
        | 'charSet'
        | 'challenge'
        | 'checked'
        | 'classID'
        | 'cols'
        | 'colSpan'
        | 'content'
        | 'controls'
        | 'coords'
        | 'crossOrigin'
        | 'dateTime'
        | 'default'
        | 'defer'
        | 'disabled'
        | 'download'
        | 'encType'
        | 'formAction'
        | 'formEncType'
        | 'formMethod'
        | 'formNoValidate'
        | 'formTarget'
        | 'frameBorder'
        | 'headers'
        | 'height'
        | 'high'
        | 'href'
        | 'hrefLang'
        | 'htmlFor'
        | 'httpEquiv'
        | 'integrity'
        | 'keyParams'
        | 'keyType'
        | 'kind'
        | 'list'
        | 'loop'
        | 'low'
        | 'manifest'
        | 'marginHeight'
        | 'marginWidth'
        | 'max'
        | 'maxLength'
        | 'media'
        | 'mediaGroup'
        | 'method'
        | 'min'
        | 'minLength'
        | 'multiple'
        | 'muted'
        | 'name'
        | 'nonce'
        | 'noValidate'
        | 'open'
        | 'optimum'
        | 'placeholder'
        | 'playsInline'
        | 'poster'
        | 'preload'
        | 'readOnly'
        | 'rel'
        | 'required'
        | 'reversed'
        | 'rows'
        | 'rowSpan'
        | 'sandbox'
        | 'scope'
        | 'scoped'
        | 'scrolling'
        | 'seamless'
        | 'selected'
        | 'shape'
        | 'sizes'
        | 'src'
        | 'srcDoc'
        | 'srcLang'
        | 'srcSet'
        | 'start'
        | 'step'
        | 'target'
        | 'useMap'
        | 'width'
        | 'wmode'
        | 'wrap'
        | 'defaultChecked'
        | 'defaultValue'
        | 'suppressContentEditableWarning'
        | 'suppressHydrationWarning'
        | 'accessKey'
        | 'className'
        | 'contentEditable'
        | 'contextMenu'
        | 'dir'
        | 'draggable'
        | 'hidden'
        | 'lang'
        | 'spellCheck'
        | 'tabIndex'
        | 'translate'
        | 'radioGroup'
        | 'role'
        | 'about'
        | 'datatype'
        | 'inlist'
        | 'prefix'
        | 'property'
        | 'resource'
        | 'typeof'
        | 'vocab'
        | 'autoCapitalize'
        | 'autoCorrect'
        | 'autoSave'
        | 'color'
        | 'itemProp'
        | 'itemScope'
        | 'itemType'
        | 'itemID'
        | 'itemRef'
        | 'results'
        | 'security'
        | 'unselectable'
        | 'inputMode'
        | 'is'
        | 'aria-activedescendant'
        | 'aria-atomic'
        | 'aria-autocomplete'
        | 'aria-busy'
        | 'aria-checked'
        | 'aria-colcount'
        | 'aria-colindex'
        | 'aria-colspan'
        | 'aria-controls'
        | 'aria-current'
        | 'aria-describedby'
        | 'aria-details'
        | 'aria-disabled'
        | 'aria-dropeffect'
        | 'aria-errormessage'
        | 'aria-expanded'
        | 'aria-flowto'
        | 'aria-grabbed'
        | 'aria-haspopup'
        | 'aria-hidden'
        | 'aria-invalid'
        | 'aria-keyshortcuts'
        | 'aria-label'
        | 'aria-labelledby'
        | 'aria-level'
        | 'aria-live'
        | 'aria-modal'
        | 'aria-multiline'
        | 'aria-multiselectable'
        | 'aria-orientation'
        | 'aria-owns'
        | 'aria-placeholder'
        | 'aria-posinset'
        | 'aria-pressed'
        | 'aria-readonly'
        | 'aria-relevant'
        | 'aria-required'
        | 'aria-roledescription'
        | 'aria-rowcount'
        | 'aria-rowindex'
        | 'aria-rowspan'
        | 'aria-selected'
        | 'aria-setsize'
        | 'aria-sort'
        | 'aria-valuemax'
        | 'aria-valuemin'
        | 'aria-valuenow'
        | 'aria-valuetext'
        | 'dangerouslySetInnerHTML'
        | 'onCopy'
        | 'onCopyCapture'
        | 'onCut'
        | 'onCutCapture'
        | 'onPaste'
        | 'onPasteCapture'
        | 'onCompositionEnd'
        | 'onCompositionEndCapture'
        | 'onCompositionStart'
        | 'onCompositionStartCapture'
        | 'onCompositionUpdate'
        | 'onCompositionUpdateCapture'
        | 'onFocus'
        | 'onFocusCapture'
        | 'onBlur'
        | 'onBlurCapture'
        | 'onChange'
        | 'onChangeCapture'
        | 'onBeforeInput'
        | 'onBeforeInputCapture'
        | 'onInput'
        | 'onInputCapture'
        | 'onReset'
        | 'onResetCapture'
        | 'onSubmit'
        | 'onSubmitCapture'
        | 'onInvalid'
        | 'onInvalidCapture'
        | 'onLoad'
        | 'onLoadCapture'
        | 'onError'
        | 'onErrorCapture'
        | 'onKeyDown'
        | 'onKeyDownCapture'
        | 'onKeyPress'
        | 'onKeyPressCapture'
        | 'onKeyUp'
        | 'onKeyUpCapture'
        | 'onAbort'
        | 'onAbortCapture'
        | 'onCanPlay'
        | 'onCanPlayCapture'
        | 'onCanPlayThrough'
        | 'onCanPlayThroughCapture'
        | 'onDurationChange'
        | 'onDurationChangeCapture'
        | 'onEmptied'
        | 'onEmptiedCapture'
        | 'onEncrypted'
        | 'onEncryptedCapture'
        | 'onEnded'
        | 'onEndedCapture'
        | 'onLoadedData'
        | 'onLoadedDataCapture'
        | 'onLoadedMetadata'
        | 'onLoadedMetadataCapture'
        | 'onLoadStart'
        | 'onLoadStartCapture'
        | 'onPause'
        | 'onPauseCapture'
        | 'onPlay'
        | 'onPlayCapture'
        | 'onPlaying'
        | 'onPlayingCapture'
        | 'onProgress'
        | 'onProgressCapture'
        | 'onRateChange'
        | 'onRateChangeCapture'
        | 'onSeeked'
        | 'onSeekedCapture'
        | 'onSeeking'
        | 'onSeekingCapture'
        | 'onStalled'
        | 'onStalledCapture'
        | 'onSuspend'
        | 'onSuspendCapture'
        | 'onTimeUpdate'
        | 'onTimeUpdateCapture'
        | 'onVolumeChange'
        | 'onVolumeChangeCapture'
        | 'onWaiting'
        | 'onWaitingCapture'
        | 'onAuxClick'
        | 'onAuxClickCapture'
        | 'onClick'
        | 'onClickCapture'
        | 'onContextMenu'
        | 'onContextMenuCapture'
        | 'onDoubleClick'
        | 'onDoubleClickCapture'
        | 'onDrag'
        | 'onDragCapture'
        | 'onDragEnd'
        | 'onDragEndCapture'
        | 'onDragEnter'
        | 'onDragEnterCapture'
        | 'onDragExit'
        | 'onDragExitCapture'
        | 'onDragLeave'
        | 'onDragLeaveCapture'
        | 'onDragOver'
        | 'onDragOverCapture'
        | 'onDragStart'
        | 'onDragStartCapture'
        | 'onDrop'
        | 'onDropCapture'
        | 'onMouseDown'
        | 'onMouseDownCapture'
        | 'onMouseEnter'
        | 'onMouseLeave'
        | 'onMouseMove'
        | 'onMouseMoveCapture'
        | 'onMouseOut'
        | 'onMouseOutCapture'
        | 'onMouseOver'
        | 'onMouseOverCapture'
        | 'onMouseUp'
        | 'onMouseUpCapture'
        | 'onSelect'
        | 'onSelectCapture'
        | 'onTouchCancel'
        | 'onTouchCancelCapture'
        | 'onTouchEnd'
        | 'onTouchEndCapture'
        | 'onTouchMove'
        | 'onTouchMoveCapture'
        | 'onTouchStart'
        | 'onTouchStartCapture'
        | 'onPointerDown'
        | 'onPointerDownCapture'
        | 'onPointerMove'
        | 'onPointerMoveCapture'
        | 'onPointerUp'
        | 'onPointerUpCapture'
        | 'onPointerCancel'
        | 'onPointerCancelCapture'
        | 'onPointerEnter'
        | 'onPointerEnterCapture'
        | 'onPointerLeave'
        | 'onPointerLeaveCapture'
        | 'onPointerOver'
        | 'onPointerOverCapture'
        | 'onPointerOut'
        | 'onPointerOutCapture'
        | 'onGotPointerCapture'
        | 'onGotPointerCaptureCapture'
        | 'onLostPointerCapture'
        | 'onLostPointerCaptureCapture'
        | 'onScroll'
        | 'onScrollCapture'
        | 'onWheel'
        | 'onWheelCapture'
        | 'onAnimationStart'
        | 'onAnimationStartCapture'
        | 'onAnimationEnd'
        | 'onAnimationEndCapture'
        | 'onAnimationIteration'
        | 'onAnimationIterationCapture'
        | 'onTransitionEnd'
        | 'onTransitionEndCapture'
        | 'key'
      >,
    | 'value'
    | 'children'
    | 'cite'
    | 'data'
    | 'form'
    | 'label'
    | 'slot'
    | 'span'
    | 'style'
    | 'summary'
    | 'title'
    | 'pattern'
    | 'size'
    | 'accept'
    | 'acceptCharset'
    | 'action'
    | 'allowFullScreen'
    | 'allowTransparency'
    | 'alt'
    | 'as'
    | 'async'
    | 'autoComplete'
    | 'autoFocus'
    | 'autoPlay'
    | 'capture'
    | 'cellPadding'
    | 'cellSpacing'
    | 'charSet'
    | 'challenge'
    | 'checked'
    | 'classID'
    | 'cols'
    | 'colSpan'
    | 'content'
    | 'controls'
    | 'coords'
    | 'crossOrigin'
    | 'dateTime'
    | 'default'
    | 'defer'
    | 'disabled'
    | 'download'
    | 'encType'
    | 'formAction'
    | 'formEncType'
    | 'formMethod'
    | 'formNoValidate'
    | 'formTarget'
    | 'frameBorder'
    | 'headers'
    | 'height'
    | 'high'
    | 'href'
    | 'hrefLang'
    | 'htmlFor'
    | 'httpEquiv'
    | 'integrity'
    | 'keyParams'
    | 'keyType'
    | 'kind'
    | 'list'
    | 'loop'
    | 'low'
    | 'manifest'
    | 'marginHeight'
    | 'marginWidth'
    | 'max'
    | 'maxLength'
    | 'media'
    | 'mediaGroup'
    | 'method'
    | 'min'
    | 'minLength'
    | 'multiple'
    | 'muted'
    | 'name'
    | 'nonce'
    | 'noValidate'
    | 'open'
    | 'optimum'
    | 'placeholder'
    | 'playsInline'
    | 'poster'
    | 'preload'
    | 'readOnly'
    | 'rel'
    | 'required'
    | 'reversed'
    | 'rows'
    | 'rowSpan'
    | 'sandbox'
    | 'scope'
    | 'scoped'
    | 'scrolling'
    | 'seamless'
    | 'selected'
    | 'shape'
    | 'sizes'
    | 'src'
    | 'srcDoc'
    | 'srcLang'
    | 'srcSet'
    | 'start'
    | 'step'
    | 'target'
    | 'useMap'
    | 'width'
    | 'wmode'
    | 'wrap'
    | 'defaultChecked'
    | 'defaultValue'
    | 'suppressContentEditableWarning'
    | 'suppressHydrationWarning'
    | 'accessKey'
    | 'className'
    | 'contentEditable'
    | 'contextMenu'
    | 'dir'
    | 'draggable'
    | 'hidden'
    | 'lang'
    | 'spellCheck'
    | 'tabIndex'
    | 'translate'
    | 'radioGroup'
    | 'role'
    | 'about'
    | 'datatype'
    | 'inlist'
    | 'prefix'
    | 'property'
    | 'resource'
    | 'typeof'
    | 'vocab'
    | 'autoCapitalize'
    | 'autoCorrect'
    | 'autoSave'
    | 'color'
    | 'itemProp'
    | 'itemScope'
    | 'itemType'
    | 'itemID'
    | 'itemRef'
    | 'results'
    | 'security'
    | 'unselectable'
    | 'inputMode'
    | 'is'
    | 'aria-activedescendant'
    | 'aria-atomic'
    | 'aria-autocomplete'
    | 'aria-busy'
    | 'aria-checked'
    | 'aria-colcount'
    | 'aria-colindex'
    | 'aria-colspan'
    | 'aria-controls'
    | 'aria-current'
    | 'aria-describedby'
    | 'aria-details'
    | 'aria-disabled'
    | 'aria-dropeffect'
    | 'aria-errormessage'
    | 'aria-expanded'
    | 'aria-flowto'
    | 'aria-grabbed'
    | 'aria-haspopup'
    | 'aria-hidden'
    | 'aria-invalid'
    | 'aria-keyshortcuts'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-level'
    | 'aria-live'
    | 'aria-modal'
    | 'aria-multiline'
    | 'aria-multiselectable'
    | 'aria-orientation'
    | 'aria-owns'
    | 'aria-placeholder'
    | 'aria-posinset'
    | 'aria-pressed'
    | 'aria-readonly'
    | 'aria-relevant'
    | 'aria-required'
    | 'aria-roledescription'
    | 'aria-rowcount'
    | 'aria-rowindex'
    | 'aria-rowspan'
    | 'aria-selected'
    | 'aria-setsize'
    | 'aria-sort'
    | 'aria-valuemax'
    | 'aria-valuemin'
    | 'aria-valuenow'
    | 'aria-valuetext'
    | 'dangerouslySetInnerHTML'
    | 'onCopy'
    | 'onCopyCapture'
    | 'onCut'
    | 'onCutCapture'
    | 'onPaste'
    | 'onPasteCapture'
    | 'onCompositionEnd'
    | 'onCompositionEndCapture'
    | 'onCompositionStart'
    | 'onCompositionStartCapture'
    | 'onCompositionUpdate'
    | 'onCompositionUpdateCapture'
    | 'onFocus'
    | 'onFocusCapture'
    | 'onBlur'
    | 'onBlurCapture'
    | 'onChange'
    | 'onChangeCapture'
    | 'onBeforeInput'
    | 'onBeforeInputCapture'
    | 'onInput'
    | 'onInputCapture'
    | 'onReset'
    | 'onResetCapture'
    | 'onSubmit'
    | 'onSubmitCapture'
    | 'onInvalid'
    | 'onInvalidCapture'
    | 'onLoad'
    | 'onLoadCapture'
    | 'onError'
    | 'onErrorCapture'
    | 'onKeyDown'
    | 'onKeyDownCapture'
    | 'onKeyPress'
    | 'onKeyPressCapture'
    | 'onKeyUp'
    | 'onKeyUpCapture'
    | 'onAbort'
    | 'onAbortCapture'
    | 'onCanPlay'
    | 'onCanPlayCapture'
    | 'onCanPlayThrough'
    | 'onCanPlayThroughCapture'
    | 'onDurationChange'
    | 'onDurationChangeCapture'
    | 'onEmptied'
    | 'onEmptiedCapture'
    | 'onEncrypted'
    | 'onEncryptedCapture'
    | 'onEnded'
    | 'onEndedCapture'
    | 'onLoadedData'
    | 'onLoadedDataCapture'
    | 'onLoadedMetadata'
    | 'onLoadedMetadataCapture'
    | 'onLoadStart'
    | 'onLoadStartCapture'
    | 'onPause'
    | 'onPauseCapture'
    | 'onPlay'
    | 'onPlayCapture'
    | 'onPlaying'
    | 'onPlayingCapture'
    | 'onProgress'
    | 'onProgressCapture'
    | 'onRateChange'
    | 'onRateChangeCapture'
    | 'onSeeked'
    | 'onSeekedCapture'
    | 'onSeeking'
    | 'onSeekingCapture'
    | 'onStalled'
    | 'onStalledCapture'
    | 'onSuspend'
    | 'onSuspendCapture'
    | 'onTimeUpdate'
    | 'onTimeUpdateCapture'
    | 'onVolumeChange'
    | 'onVolumeChangeCapture'
    | 'onWaiting'
    | 'onWaitingCapture'
    | 'onAuxClick'
    | 'onAuxClickCapture'
    | 'onClick'
    | 'onClickCapture'
    | 'onContextMenu'
    | 'onContextMenuCapture'
    | 'onDoubleClick'
    | 'onDoubleClickCapture'
    | 'onDrag'
    | 'onDragCapture'
    | 'onDragEnd'
    | 'onDragEndCapture'
    | 'onDragEnter'
    | 'onDragEnterCapture'
    | 'onDragExit'
    | 'onDragExitCapture'
    | 'onDragLeave'
    | 'onDragLeaveCapture'
    | 'onDragOver'
    | 'onDragOverCapture'
    | 'onDragStart'
    | 'onDragStartCapture'
    | 'onDrop'
    | 'onDropCapture'
    | 'onMouseDown'
    | 'onMouseDownCapture'
    | 'onMouseEnter'
    | 'onMouseLeave'
    | 'onMouseMove'
    | 'onMouseMoveCapture'
    | 'onMouseOut'
    | 'onMouseOutCapture'
    | 'onMouseOver'
    | 'onMouseOverCapture'
    | 'onMouseUp'
    | 'onMouseUpCapture'
    | 'onSelect'
    | 'onSelectCapture'
    | 'onTouchCancel'
    | 'onTouchCancelCapture'
    | 'onTouchEnd'
    | 'onTouchEndCapture'
    | 'onTouchMove'
    | 'onTouchMoveCapture'
    | 'onTouchStart'
    | 'onTouchStartCapture'
    | 'onPointerDown'
    | 'onPointerDownCapture'
    | 'onPointerMove'
    | 'onPointerMoveCapture'
    | 'onPointerUp'
    | 'onPointerUpCapture'
    | 'onPointerCancel'
    | 'onPointerCancelCapture'
    | 'onPointerEnter'
    | 'onPointerEnterCapture'
    | 'onPointerLeave'
    | 'onPointerLeaveCapture'
    | 'onPointerOver'
    | 'onPointerOverCapture'
    | 'onPointerOut'
    | 'onPointerOutCapture'
    | 'onGotPointerCapture'
    | 'onGotPointerCaptureCapture'
    | 'onLostPointerCapture'
    | 'onLostPointerCaptureCapture'
    | 'onScroll'
    | 'onScrollCapture'
    | 'onWheel'
    | 'onWheelCapture'
    | 'onAnimationStart'
    | 'onAnimationStartCapture'
    | 'onAnimationEnd'
    | 'onAnimationEndCapture'
    | 'onAnimationIteration'
    | 'onAnimationIterationCapture'
    | 'onTransitionEnd'
    | 'onTransitionEndCapture'
    | 'key'
    | 'markers'
    | 'description'
  > &
    React.RefAttributes<unknown>
>
export default _default
