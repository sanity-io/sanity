import React from 'react'
import {ChangeIndicatorProvider} from '../components/changeIndicators'
import {FormNodeContext} from './FormNodeContext'
import {FieldProps} from './types'

export function FormNodeProvider(props: {children?: React.ReactNode; fieldProps: FieldProps}) {
  const {children, fieldProps} = props

  return (
    // @todo
    <FormNodeContext.Provider value={{id: ''}}>
      <ChangeIndicatorProvider
        compareValue={fieldProps.compareValue}
        path={fieldProps.path}
        value={fieldProps.value}
      >
        {children}
      </ChangeIndicatorProvider>
    </FormNodeContext.Provider>
  )
}
