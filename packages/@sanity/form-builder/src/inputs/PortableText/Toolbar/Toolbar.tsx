/* eslint-disable complexity */
import React, {RefObject} from 'react'
import {Tooltip} from 'react-tippy'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import Button from 'part:@sanity/components/buttons/default'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import ValidationList from 'part:@sanity/components/validation/list'
import WarningIcon from 'part:@sanity/base/warning-icon'
import Poppable from 'part:@sanity/components/utilities/poppable'
import {debounce, xor, uniq} from 'lodash'
import {IS_MAC} from '../PortableTextInput'
import PrimaryGroup from './PrimaryGroup'
import styles from './Toolbar.css'
import {Path} from '../../../typedefs/path'
import {Marker} from '../../../typedefs'
import {
  PortableTextEditor,
  EditorSelection,
  HotkeyOptions,
  PortableTextBlock,
  RenderAttributes,
  Type,
  RenderBlockFunction
} from '@sanity/portable-text-editor'

const BREAKPOINT_SCREEN_MEDIUM = 512

const collapsibleGroups = ['insertMenu', 'annotationButtons', 'decoratorButtons', 'listItemButtons']

const denyFocusChange = (event: React.SyntheticEvent<HTMLDivElement>): void => {
  event.preventDefault()
}

type Props = {
  editor: PortableTextEditor
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  isReadOnly: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  onToggleFullscreen: () => void
  renderBlock: RenderBlockFunction
  selection: EditorSelection
}

type ToolbarState = {
  collapsedGroups: string[]
  collapsePrimary: boolean
  collapsePrimaryIsOpen: boolean
  isMobile: boolean
  lastContentWidth: number
  showValidationTooltip: boolean
}

export default class Toolbar extends React.Component<Props, ToolbarState> {
  state = {
    collapsedGroups: [],
    collapsePrimary: false,
    collapsePrimaryIsOpen: false,
    isMobile: false,
    lastContentWidth: -1,
    showValidationTooltip: false
  }
  _primaryToolbar: RefObject<HTMLDivElement> = React.createRef()

  constructor(props: Props) {
    super(props)
    if (window) {
      this.state = {
        ...this.state,
        isMobile: window.innerWidth < BREAKPOINT_SCREEN_MEDIUM
      }
    }
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    return this.props.selection !== nextProps.selection || this.props.editor !== nextProps.editor
  }

  handleOpenPrimary = (): void => {
    this.setState({
      collapsePrimaryIsOpen: true
    })
  }
  handleClosePrimary = (): void => {
    this.setState({
      collapsePrimaryIsOpen: false
    })
  }
  handleClickOutsidePrimary = (): void => {
    this.setState({
      collapsePrimaryIsOpen: false
    })
  }
  handleFocus = (focusPath: []): void => {
    const {onFocus} = this.props
    onFocus(focusPath)
  }
  handleCloseValidationResults = (): void => {
    this.setState({showValidationTooltip: false})
  }
  handleToggleValidationResults = (): void => {
    this.setState(prevState => ({
      showValidationTooltip: !prevState.showValidationTooltip
    }))
  }
  handleResize = debounce(() => {
    if (this.state.isMobile) return
    const {_primaryToolbar} = this
    const {collapsedGroups, lastContentWidth, collapsePrimary} = this.state
    if (!_primaryToolbar || !_primaryToolbar.current) return
    const width = _primaryToolbar.current.offsetWidth
    const contentWidth = _primaryToolbar.current.scrollWidth
    if (contentWidth > width && !collapsePrimary) {
      const groupToCollapse = xor(collapsibleGroups, collapsedGroups)[0]
      this.setState(
        {
          collapsedGroups: [...collapsedGroups, groupToCollapse],
          lastContentWidth: contentWidth
        },
        () => {
          if (contentWidth > width && collapsedGroups.length != collapsibleGroups.length) {
            this.handleResize()
          } else if (collapsedGroups.length === collapsibleGroups.length && contentWidth > width) {
            this.setState({collapsePrimary: true})
          }
        }
      )
    }
    if (collapsePrimary && lastContentWidth < width) {
      this.setState({
        collapsePrimary: false,
        collapsePrimaryIsOpen: false
      })
    }
    if (width >= lastContentWidth && collapsedGroups.length != 0) {
      this.setState({
        collapsedGroups: []
      })
    }
  }, 50)

  render(): JSX.Element {
    const {editor, isFullscreen, markers, onToggleFullscreen} = this.props
    if (!editor) {
      return null
    }
    const {showValidationTooltip, isMobile} = this.state
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const insertItems = uniq(ptFeatures.types.inlineObjects.concat(ptFeatures.types.blockObjects))
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const warnings = validation.filter(marker => marker.level === 'warning')
    const {collapsedGroups, collapsePrimary, collapsePrimaryIsOpen} = this.state
    const rootClassNames = [styles.root, ...(isFullscreen ? [styles.fullscreen] : [])].join(' ')
    return (
      <div
        // Ensure the editor doesn't lose focus when interacting with the toolbar (prevent focus click events)
        onMouseDown={denyFocusChange}
        onKeyPress={denyFocusChange}
        className={rootClassNames}
      >
        <div className={styles.primary} ref={this._primaryToolbar}>
          {collapsePrimary && (
            <Button
              className={styles.showMoreButton}
              onClick={this.handleOpenPrimary}
              kind="simple"
            >
              Show menu&nbsp;
              <span>
                <ArrowIcon color="inherit" />
              </span>
              <Poppable onClickOutside={this.handleClosePrimary} onEscape={this.handleClosePrimary}>
                {collapsePrimaryIsOpen && (
                  <PrimaryGroup
                    {...this.props}
                    isPopped
                    collapsedGroups={collapsedGroups}
                    insertItems={insertItems}
                  />
                )}
              </Poppable>
            </Button>
          )}
          <div className={styles.primaryInner}>
            {!collapsePrimary && (
              <PrimaryGroup
                {...this.props}
                collapsedGroups={collapsedGroups}
                insertItems={insertItems}
                isMobile={isMobile}
              />
            )}
          </div>
        </div>
        <div className={styles.secondary}>
          {isFullscreen && (errors.length > 0 || warnings.length > 0) && (
            <Tooltip
              arrow
              duration={100}
              html={
                <ValidationList
                  markers={validation}
                  showLink
                  isOpen={showValidationTooltip}
                  documentType={
                    PortableTextEditor.getPortableTextFeatures(editor).types.portableText
                  }
                  onClose={this.handleCloseValidationResults}
                  onFocus={this.handleFocus}
                />
              }
              interactive
              onRequestClose={this.handleCloseValidationResults}
              open={showValidationTooltip}
              position="bottom"
              style={{padding: 0}}
              theme="light"
              trigger="click"
            >
              <Button
                color="danger"
                icon={WarningIcon}
                kind="simple"
                onClick={this.handleToggleValidationResults}
                padding="small"
              >
                {errors.length}
                <span style={{paddingLeft: '0.5em'}}>
                  <ChevronDown />
                </span>
              </Button>
            </Tooltip>
          )}
          <div className={styles.fullscreenButtonContainer}>
            <Button
              kind="simple"
              onClick={onToggleFullscreen}
              title={`Open in fullscreen (${IS_MAC ? 'cmd' : 'ctrl'}+enter)`}
              icon={isFullscreen ? CloseIcon : FullscreenIcon}
              bleed
            />
          </div>
        </div>
      </div>
    )
  }
}
