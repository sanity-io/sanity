import React, {ReactNode, useCallback, useRef, useState} from 'react'
import {RenderAnnotationFunction, BlockAnnotationRenderProps} from '@sanity/portable-text-editor'
import {PortalProvider, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {ToolbarPopover} from '../comment-input/toolbar/FloatingToolbar'
import {LinkEditForm} from '../comment-input/toolbar/LinkEditForm'
import {useCommentInput} from '../comment-input/useCommentInput'

const Link = (props: BlockAnnotationRenderProps) => {
  const {value, children} = props
  const [rootElement, setRootElement] = useState<HTMLAnchorElement | null>(null)
  const [popoverRef, setPopoverRef] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(!!value)
  const {focusEditor} = useCommentInput()
  const handleClick = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleChange = useCallback((href?: string) => {
    // console.log(href)
  }, [])

  useClickOutside(handleClose, [rootElement, popoverRef])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          focusEditor()
        }
        if (event.key === 'Tab') {
          // console.log('tab')
        }
      },
      [focusEditor],
    ),
  )

  return (
    <>
      <a ref={setRootElement} href={value.href as string} onClick={handleClick}>
        {children}
      </a>
      {/* {open && (
        <span contentEditable={false}>
          <PortalProvider>
            <ToolbarPopover
              constrainSize
              content={<LinkEditForm value={value.href as string} onChange={handleChange} />}
              fallbackPlacements={['bottom', 'top']}
              open={open}
              portal
              placement="top"
              ref={setPopoverRef}
              referenceElement={rootElement}
            />
          </PortalProvider>
        </span>
      )} */}
    </>
  )
}

export const renderAnnotation: RenderAnnotationFunction = (
  annotationProps: BlockAnnotationRenderProps,
) => {
  if (annotationProps.schemaType.name === 'link') {
    return <Link {...annotationProps} />
  }
  return annotationProps.children
}
