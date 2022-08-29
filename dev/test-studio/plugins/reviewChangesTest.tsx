import {createPlugin} from 'sanity'
import React from 'react'

export const reviewChangesTest = createPlugin({
  name: 'review-changes-test',
  form: {
    renderDiff: (props, next) => {
      if (props?.schemaType?.title === 'String with render diff component') {
        return (
          <div data-testid="render-diff-string" style={{border: '2px solid red'}}>
            {next(props)}
          </div>
        )
      }

      if (props?.schemaType?.title === 'Number with render diff component') {
        return (
          <div data-testid="render-diff-number" style={{border: '2px solid red'}}>
            {next(props)}
          </div>
        )
      }

      if (props?.schemaType?.title === 'Boolean with render diff component') {
        return (
          <div data-testid="render-diff-boolean" style={{border: '2px solid red'}}>
            {next(props)}
          </div>
        )
      }

      if (props?.schemaType?.title === 'Slug with render diff component') {
        return (
          <div data-testid="render-diff-slug" style={{border: '2px solid red'}}>
            {next(props)}
          </div>
        )
      }

      return undefined
    },
  },
})
