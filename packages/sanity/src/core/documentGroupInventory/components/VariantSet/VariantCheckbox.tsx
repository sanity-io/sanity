import {Checkbox} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {variantCheckbox} from './VariantCheckbox.css'

export function VariantCheckbox(props: ComponentProps<typeof Checkbox>) {
  const {className, ...rest} = props

  return <Checkbox {...rest} className={clsx(variantCheckbox, className)} />
}
