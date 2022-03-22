import type React from 'react'
interface CaptureOutsideClicksProps extends React.HTMLProps<HTMLDivElement> {
  onClickOutside?: (event: MouseEvent) => void
  wrapperElement?: string
}
export default class CaptureOutsideClicks extends React.Component<CaptureOutsideClicksProps> {
  hadMouseDown: boolean
  _wrapperElement: HTMLDivElement | null
  UNSAFE_componentWillMount(): void
  componentWillUnmount(): void
  handleMouseDown: (event: MouseEvent) => void
  handleDocumentClick: (event: MouseEvent) => void
  setWrapperElement: (element: HTMLDivElement | null) => void
  render(): React.DOMElement<
    {
      ref: (element: HTMLDivElement) => void
      accept?: string
      acceptCharset?: string
      action?: string
      allowFullScreen?: boolean
      allowTransparency?: boolean
      alt?: string
      as?: string
      async?: boolean
      autoComplete?: string
      autoFocus?: boolean
      autoPlay?: boolean
      capture?: string | boolean
      cellPadding?: string | number
      cellSpacing?: string | number
      charSet?: string
      challenge?: string
      checked?: boolean
      cite?: string
      classID?: string
      cols?: number
      colSpan?: number
      content?: string
      controls?: boolean
      coords?: string
      crossOrigin?: string
      data?: string
      dateTime?: string
      default?: boolean
      defer?: boolean
      disabled?: boolean
      download?: any
      encType?: string
      form?: string
      formAction?: string
      formEncType?: string
      formMethod?: string
      formNoValidate?: boolean
      formTarget?: string
      frameBorder?: string | number
      headers?: string
      height?: string | number
      high?: number
      href?: string
      hrefLang?: string
      htmlFor?: string
      httpEquiv?: string
      integrity?: string
      keyParams?: string
      keyType?: string
      kind?: string
      label?: string
      list?: string
      loop?: boolean
      low?: number
      manifest?: string
      marginHeight?: number
      marginWidth?: number
      max?: string | number
      maxLength?: number
      media?: string
      mediaGroup?: string
      method?: string
      min?: string | number
      minLength?: number
      multiple?: boolean
      muted?: boolean
      name?: string
      nonce?: string
      noValidate?: boolean
      open?: boolean
      optimum?: number
      pattern?: string
      placeholder?: string
      playsInline?: boolean
      poster?: string
      preload?: string
      readOnly?: boolean
      rel?: string
      required?: boolean
      reversed?: boolean
      rows?: number
      rowSpan?: number
      sandbox?: string
      scope?: string
      scoped?: boolean
      scrolling?: string
      seamless?: boolean
      selected?: boolean
      shape?: string
      size?: number
      sizes?: string
      span?: number
      src?: string
      srcDoc?: string
      srcLang?: string
      srcSet?: string
      start?: number
      step?: string | number
      summary?: string
      target?: string
      type?: string
      useMap?: string
      value?: string | number | readonly string[]
      width?: string | number
      wmode?: string
      wrap?: string
      defaultChecked?: boolean
      defaultValue?: string | number | readonly string[]
      suppressContentEditableWarning?: boolean
      suppressHydrationWarning?: boolean
      accessKey?: string
      className?: string
      contentEditable?: boolean | 'inherit' | 'true' | 'false'
      contextMenu?: string
      dir?: string
      draggable?: boolean | 'true' | 'false'
      hidden?: boolean
      id?: string
      lang?: string
      slot?: string
      spellCheck?: boolean | 'true' | 'false'
      style?: React.CSSProperties
      tabIndex?: number
      title?: string
      translate?: 'yes' | 'no'
      radioGroup?: string
      role?: string
      about?: string
      datatype?: string
      inlist?: any
      prefix?: string
      property?: string
      resource?: string
      typeof?: string
      vocab?: string
      autoCapitalize?: string
      autoCorrect?: string
      autoSave?: string
      color?: string
      itemProp?: string
      itemScope?: boolean
      itemType?: string
      itemID?: string
      itemRef?: string
      results?: number
      security?: string
      unselectable?: 'on' | 'off'
      inputMode?: 'text' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
      is?: string
      'aria-activedescendant'?: string
      'aria-atomic'?: boolean | 'true' | 'false'
      'aria-autocomplete'?: 'none' | 'list' | 'inline' | 'both'
      'aria-busy'?: boolean | 'true' | 'false'
      'aria-checked'?: boolean | 'true' | 'false' | 'mixed'
      'aria-colcount'?: number
      'aria-colindex'?: number
      'aria-colspan'?: number
      'aria-controls'?: string
      'aria-current'?: boolean | 'time' | 'step' | 'true' | 'false' | 'page' | 'location' | 'date'
      'aria-describedby'?: string
      'aria-details'?: string
      'aria-disabled'?: boolean | 'true' | 'false'
      'aria-dropeffect'?: 'link' | 'none' | 'copy' | 'execute' | 'move' | 'popup'
      'aria-errormessage'?: string
      'aria-expanded'?: boolean | 'true' | 'false'
      'aria-flowto'?: string
      'aria-grabbed'?: boolean | 'true' | 'false'
      'aria-haspopup'?: boolean | 'dialog' | 'menu' | 'true' | 'false' | 'listbox' | 'tree' | 'grid'
      'aria-hidden'?: boolean | 'true' | 'false'
      'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'
      'aria-keyshortcuts'?: string
      'aria-label'?: string
      'aria-labelledby'?: string
      'aria-level'?: number
      'aria-live'?: 'off' | 'assertive' | 'polite'
      'aria-modal'?: boolean | 'true' | 'false'
      'aria-multiline'?: boolean | 'true' | 'false'
      'aria-multiselectable'?: boolean | 'true' | 'false'
      'aria-orientation'?: 'horizontal' | 'vertical'
      'aria-owns'?: string
      'aria-placeholder'?: string
      'aria-posinset'?: number
      'aria-pressed'?: boolean | 'true' | 'false' | 'mixed'
      'aria-readonly'?: boolean | 'true' | 'false'
      'aria-relevant'?:
        | 'text'
        | 'additions'
        | 'additions removals'
        | 'additions text'
        | 'all'
        | 'removals'
        | 'removals additions'
        | 'removals text'
        | 'text additions'
        | 'text removals'
      'aria-required'?: boolean | 'true' | 'false'
      'aria-roledescription'?: string
      'aria-rowcount'?: number
      'aria-rowindex'?: number
      'aria-rowspan'?: number
      'aria-selected'?: boolean | 'true' | 'false'
      'aria-setsize'?: number
      'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other'
      'aria-valuemax'?: number
      'aria-valuemin'?: number
      'aria-valuenow'?: number
      'aria-valuetext'?: string
      children?: React.ReactNode
      dangerouslySetInnerHTML?: {
        __html: string
      }
      onCopy?: (event: React.ClipboardEvent<HTMLDivElement>) => void
      onCopyCapture?: (event: React.ClipboardEvent<HTMLDivElement>) => void
      onCut?: (event: React.ClipboardEvent<HTMLDivElement>) => void
      onCutCapture?: (event: React.ClipboardEvent<HTMLDivElement>) => void
      onPaste?: (event: React.ClipboardEvent<HTMLDivElement>) => void
      onPasteCapture?: (event: React.ClipboardEvent<HTMLDivElement>) => void
      onCompositionEnd?: (event: React.CompositionEvent<HTMLDivElement>) => void
      onCompositionEndCapture?: (event: React.CompositionEvent<HTMLDivElement>) => void
      onCompositionStart?: (event: React.CompositionEvent<HTMLDivElement>) => void
      onCompositionStartCapture?: (event: React.CompositionEvent<HTMLDivElement>) => void
      onCompositionUpdate?: (event: React.CompositionEvent<HTMLDivElement>) => void
      onCompositionUpdateCapture?: (event: React.CompositionEvent<HTMLDivElement>) => void
      onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void
      onFocusCapture?: (event: React.FocusEvent<HTMLDivElement>) => void
      onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void
      onBlurCapture?: (event: React.FocusEvent<HTMLDivElement>) => void
      onChange?: (event: React.FormEvent<HTMLDivElement>) => void
      onChangeCapture?: (event: React.FormEvent<HTMLDivElement>) => void
      onBeforeInput?: (event: React.FormEvent<HTMLDivElement>) => void
      onBeforeInputCapture?: (event: React.FormEvent<HTMLDivElement>) => void
      onInput?: (event: React.FormEvent<HTMLDivElement>) => void
      onInputCapture?: (event: React.FormEvent<HTMLDivElement>) => void
      onReset?: (event: React.FormEvent<HTMLDivElement>) => void
      onResetCapture?: (event: React.FormEvent<HTMLDivElement>) => void
      onSubmit?: (event: React.FormEvent<HTMLDivElement>) => void
      onSubmitCapture?: (event: React.FormEvent<HTMLDivElement>) => void
      onInvalid?: (event: React.FormEvent<HTMLDivElement>) => void
      onInvalidCapture?: (event: React.FormEvent<HTMLDivElement>) => void
      onLoad?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onLoadCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onError?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onErrorCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void
      onKeyDownCapture?: (event: React.KeyboardEvent<HTMLDivElement>) => void
      onKeyPress?: (event: React.KeyboardEvent<HTMLDivElement>) => void
      onKeyPressCapture?: (event: React.KeyboardEvent<HTMLDivElement>) => void
      onKeyUp?: (event: React.KeyboardEvent<HTMLDivElement>) => void
      onKeyUpCapture?: (event: React.KeyboardEvent<HTMLDivElement>) => void
      onAbort?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onAbortCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onCanPlay?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onCanPlayCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onCanPlayThrough?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onCanPlayThroughCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onDurationChange?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onDurationChangeCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onEmptied?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onEmptiedCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onEncrypted?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onEncryptedCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onEnded?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onEndedCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onLoadedData?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onLoadedDataCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onLoadedMetadata?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onLoadedMetadataCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onLoadStart?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onLoadStartCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onPause?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onPauseCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onPlay?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onPlayCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onPlaying?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onPlayingCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onProgress?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onProgressCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onRateChange?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onRateChangeCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onSeeked?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onSeekedCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onSeeking?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onSeekingCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onStalled?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onStalledCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onSuspend?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onSuspendCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onTimeUpdate?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onTimeUpdateCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onVolumeChange?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onVolumeChangeCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onWaiting?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onWaitingCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onAuxClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onAuxClickCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onClickCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onContextMenuCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onDoubleClickCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onDrag?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragEndCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragEnterCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragExit?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragExitCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragLeaveCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragOverCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void
      onDragStartCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onDrop?: (event: React.DragEvent<HTMLDivElement>) => void
      onDropCapture?: (event: React.DragEvent<HTMLDivElement>) => void
      onMouseDown?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseDownCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseEnter?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseLeave?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseMove?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseMoveCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseOut?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseOutCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseOverCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseUp?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onMouseUpCapture?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
      onSelect?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onSelectCapture?: (event: React.SyntheticEvent<HTMLDivElement, Event>) => void
      onTouchCancel?: (event: React.TouchEvent<HTMLDivElement>) => void
      onTouchCancelCapture?: (event: React.TouchEvent<HTMLDivElement>) => void
      onTouchEnd?: (event: React.TouchEvent<HTMLDivElement>) => void
      onTouchEndCapture?: (event: React.TouchEvent<HTMLDivElement>) => void
      onTouchMove?: (event: React.TouchEvent<HTMLDivElement>) => void
      onTouchMoveCapture?: (event: React.TouchEvent<HTMLDivElement>) => void
      onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void
      onTouchStartCapture?: (event: React.TouchEvent<HTMLDivElement>) => void
      onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerDownCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerMoveCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerUpCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerCancelCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerEnter?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerEnterCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerLeave?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerLeaveCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerOver?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerOverCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerOut?: (event: React.PointerEvent<HTMLDivElement>) => void
      onPointerOutCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onGotPointerCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onGotPointerCaptureCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onLostPointerCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onLostPointerCaptureCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
      onScroll?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void
      onScrollCapture?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void
      onWheel?: (event: React.WheelEvent<HTMLDivElement>) => void
      onWheelCapture?: (event: React.WheelEvent<HTMLDivElement>) => void
      onAnimationStart?: (event: React.AnimationEvent<HTMLDivElement>) => void
      onAnimationStartCapture?: (event: React.AnimationEvent<HTMLDivElement>) => void
      onAnimationEnd?: (event: React.AnimationEvent<HTMLDivElement>) => void
      onAnimationEndCapture?: (event: React.AnimationEvent<HTMLDivElement>) => void
      onAnimationIteration?: (event: React.AnimationEvent<HTMLDivElement>) => void
      onAnimationIterationCapture?: (event: React.AnimationEvent<HTMLDivElement>) => void
      onTransitionEnd?: (event: React.TransitionEvent<HTMLDivElement>) => void
      onTransitionEndCapture?: (event: React.TransitionEvent<HTMLDivElement>) => void
      key?: string | number
    },
    HTMLDivElement
  >
}
export {}
