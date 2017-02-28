# base

Sanity plugin containing the base components and roles for a Sanity configuration


## Internationalization?

```js
import React from 'react'
import MyComponent from 'path-to-component'
import SanityIntlProvider from 'part:@sanity/base/sanity-intl-provider'
import {FormattedMessage} from 'part:@sanity/base/locale/intl'


export default class i18nExample extends React.Component {

  render() {
    return (
      <SanityIntlProvider supportedLanguages={['en-US']}>
        <MyComponent>
          <FormattedMessage
            id={`schema.${type.name}.${field.name}`}
            description="Some description"
            defaultMessage="some message"
          />
        </MyComponent>
      </SanityIntlProvider>
    )
  }
}
```
