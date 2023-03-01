import React, {PropsWithChildren, useEffect, useRef, useState} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {debugWithName} from '../../utils/debug'
import {EditorChange, InvalidValue, InvalidValueResolution} from '../../types/editor'
import {validateValue} from '../../utils/validateValue'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextEditorValidationContext} from '../hooks/useValidation'

const debug = debugWithName('component:PortableTextEditor:Validator')

/**
 * @internal
 */
export interface ValidatorProps extends PropsWithChildren {
  keyGenerator: () => string
  onChange: (change: EditorChange) => void
  portableTextEditor: PortableTextEditor
  value: PortableTextBlock[] | undefined
}

/**
 * Validates a new PortableText value
 *
 * @internal
 */
export function Validator(props: ValidatorProps) {
  const {portableTextEditor, keyGenerator, value, onChange} = props
  const {change$, schemaTypes} = portableTextEditor
  const previousValue = useRef<PortableTextBlock[] | undefined | null>(null)
  const [validation, setValidation] = useState<{
    valid: boolean
    resolution: InvalidValueResolution | null
  } | null>(null)

  useEffect(() => {
    const lengthChanged = value?.length !== previousValue.current?.length
    const isNewValue = previousValue.current === null
    // TODO: could we be running this in a requestIdleCallback and validate more aggressively?
    const shouldValidate = isNewValue || lengthChanged
    if (shouldValidate) {
      const _validation = validateValue(value, schemaTypes, keyGenerator)
      debug('Validating')
      change$.next({type: 'loading', isLoading: true})
      setValidation(_validation)
      change$.next({type: 'loading', isLoading: false})
      if (!_validation.valid && value) {
        const change: InvalidValue = {
          type: 'invalidValue',
          resolution: _validation.resolution,
          value,
        }
        change$.next(change)
        onChange(change) // Also call onChange here directly, since the Synchronizer might not even be mounted at this point and thus unable to call it.
      }
    }
    previousValue.current = value
  }, [change$, keyGenerator, schemaTypes, value, onChange])

  if (validation && !validation.valid) {
    console.error(validation?.resolution?.description)
    return <>{validation?.resolution?.description}</>
  }

  return (
    <PortableTextEditorValidationContext.Provider value={validation}>
      <>{props.children}</>
    </PortableTextEditorValidationContext.Provider>
  )
}
