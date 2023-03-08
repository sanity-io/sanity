import {TextInput} from '@sanity/ui'
import React, {ComponentProps, useEffect} from 'react'
import {useCommandList} from './useCommandList'

/**
 * A Sanity UI `<TextInput />` component that will capture focus when
 * rendered within a wrapping `<CommandListProvider>`.
 *
 * @internal
 */
export function CommandListTextInput(props: ComponentProps<typeof TextInput>) {
  const {setInputElement} = useCommandList()

  useEffect(() => {
    return () => setInputElement(null)
  }, [setInputElement])

  return <TextInput {...props} ref={setInputElement} />
}
