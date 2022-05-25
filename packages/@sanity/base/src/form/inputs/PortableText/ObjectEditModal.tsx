import {Path} from '@sanity/types'
import React, {useCallback, useMemo} from 'react'
import {ObjectFormNode} from '../../store/types/nodes'
import {ArrayOfObjectsMember} from '../../types'
import {_getModalOption} from './object/helpers'
import {DefaultEditDialog} from './object/renderers/DefaultEditDialog'
import {PopoverEditDialog} from './object/renderers/PopoverObjectEditing'

export function ObjectEditModal(props: {
  children: React.ReactNode
  elementRef: React.MutableRefObject<HTMLElement | null>
  member: ArrayOfObjectsMember<ObjectFormNode>
  onClose: (path: Path) => void
  scrollElement: HTMLElement
}) {
  const {member, onClose, scrollElement, elementRef} = props
  const {schemaType} = member.item
  const modalOption = useMemo(() => _getModalOption({type: schemaType}), [schemaType])

  const handleClose = useCallback(() => {
    onClose(member.item.path)
  }, [member, onClose])

  const title = <>Edit {member.item.schemaType.title}</>

  if (modalOption.type === 'popover') {
    return (
      <PopoverEditDialog
        elementRef={elementRef}
        onClose={handleClose}
        scrollElement={scrollElement}
        title={title}
      >
        {props.children}
      </PopoverEditDialog>
    )
  }

  return (
    <DefaultEditDialog title={title} onClose={handleClose}>
      {props.children}
    </DefaultEditDialog>
  )
}
