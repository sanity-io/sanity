import React, {PropsWithChildren, useEffect, useRef, useState} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {debugWithName} from '../../utils/debug'
import {InvalidValueResolution} from '../../types/editor'
import {validateValue} from '../../utils/validateValue'
import {PortableTextEditor} from '../PortableTextEditor'

const debug = debugWithName('component:PortableTextEditor:Validator')

/**
 * @internal
 */
export interface ValidatorProps extends PropsWithChildren {
  keyGenerator: () => string
  portableTextEditor: PortableTextEditor
  value: PortableTextBlock[] | undefined
}

/**
 * Validates a new PortableText value
 *
 * @internal
 */
export function Validator(props: ValidatorProps) {
  const {portableTextEditor, keyGenerator, value} = props
  const {change$, schemaTypes} = portableTextEditor
  const previousValue = useRef<PortableTextBlock[] | undefined>()
  const [invalidValueResolution, setInvalidValueResolution] =
    useState<InvalidValueResolution | null>(null)

  useEffect(() => {
    const hasNewBlock =
      value && previousValue.current && value.length > previousValue.current.length
    const isNewValue = !previousValue.current && value
    if (isNewValue || hasNewBlock) {
      debug('Validating')
      change$.next({type: 'loading', isLoading: true})
      const validation = validateValue(value, schemaTypes, keyGenerator)
      change$.next({type: 'loading', isLoading: false})
      if (value && !validation.valid) {
        change$.next({
          type: 'invalidValue',
          resolution: validation.resolution,
          value: value,
        })
        setInvalidValueResolution(validation.resolution)
      }
    }
    previousValue.current = value
  }, [keyGenerator, change$, schemaTypes, value])
  if (invalidValueResolution) {
    return <>{invalidValueResolution.description}</>
  }
  return <>{props.children}</>
}
