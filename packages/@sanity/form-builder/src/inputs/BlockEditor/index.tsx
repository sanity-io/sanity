import {KeyUtils} from 'slate'
import React from 'react'
import {randomKey} from '@sanity/block-tools'
import FormBuilderErrorBoundary from '../../FormBuilderErrorBoundary'
import SyncWrapper from './SyncWrapper'

// Set our own key generator for Slate (as early as possible)
const keyGenerator = () => randomKey(12)
KeyUtils.setGenerator(keyGenerator)

// eslint-disable-next-line react/display-name
export default React.forwardRef(function BlockEditorRoot(props, ref: any) {
  return (
    <FormBuilderErrorBoundary>
      <SyncWrapper {...props} ref={ref} />
    </FormBuilderErrorBoundary>
  )
})
