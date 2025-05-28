import {defineType} from '@sanity/types'
import {useEffect, useRef} from 'react'
import {set} from 'sanity'

export const patchOnMountDebug = defineType({
  type: 'document',
  name: 'patchOnMountDebug',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  components: {
    // eslint-disable-next-line func-name-matching
    input: function PatchOnMountInput(props) {
      const {onChange} = props
      const mounted = useRef(false)

      useEffect(() => {
        if (!mounted.current) {
          onChange(set(`${Math.random()}`, ['title']))
          mounted.current = true
        }
      }, [onChange])

      return props.renderDefault(props)
    },
  },
})
