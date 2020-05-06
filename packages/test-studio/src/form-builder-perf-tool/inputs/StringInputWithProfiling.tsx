import * as React from 'react'
import {StringInput} from './StringInput'
import {ComponentProps} from 'react'

export const StringInputWithProfiling = React.memo(
  React.forwardRef((props: ComponentProps<StringInput>, ref) => {
    const {onChange, ...rest} = props
    const handleChange = React.useCallback(event => {
      console.time('onChange')
      onChange(event)
      console.timeEnd('onChange')
    }, [])
    return <StringInput ref={ref} onChange={handleChange} {...rest} />
  })
)
