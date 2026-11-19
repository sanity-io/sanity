import {useEffect, useRef} from 'react'
import {type ActorRefFromLogic} from 'xstate'

import {type variantCreationMachine} from '../../machines/variantCreationMachine'

/**
 * Answers a request, from outside the inventory, to create a variant: when `variantId` is set,
 * the Create variant form opens with that variant picked. Add to and Start from keep their own
 * defaults (the current perspective, the nearest version).
 *
 * Each request is answered once: `onClose` is called when the form it opened closes (the variant
 * was created, or the form was cancelled), or straight away when the form cannot open (variant
 * creation is off or read-only), so the requester can clear its request.
 *
 * @internal
 */
export function useCreateVariantRequest({
  variantCreationRef,
  variantId,
  isOpen,
  onClose,
}: {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  /** The requested variant, or `undefined` when nothing is requested. */
  variantId: string | undefined
  /** Whether the Create variant form is open (configuring or creating). */
  isOpen: boolean
  onClose: (() => void) | undefined
}): void {
  const answered = useRef<string | undefined>(undefined)
  /** `requested` once the form was asked to open, `open` once a render has seen it open. */
  const requestState = useRef<'none' | 'requested' | 'open'>('none')
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (typeof variantId === 'undefined') {
      answered.current = undefined
      return
    }
    if (answered.current === variantId) return
    answered.current = variantId
    variantCreationRef.send({type: 'createVariant.request'})
    if (!variantCreationRef.getSnapshot().matches('active')) {
      onCloseRef.current?.()
      return
    }
    variantCreationRef.send({type: 'createVariant.selectVariant', variantId})
    requestState.current = 'requested'
  }, [variantId, variantCreationRef])

  // The render that sent the request still saw the form closed, so the request counts as answered
  // only once a render has seen the form open and a later one sees it closed.
  useEffect(() => {
    if (isOpen) {
      if (requestState.current === 'requested') requestState.current = 'open'
      return
    }
    if (requestState.current !== 'open') return
    requestState.current = 'none'
    onCloseRef.current?.()
  }, [isOpen])
}
