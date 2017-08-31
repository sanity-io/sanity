# Custom input components

Even though the Form Builder comes with a set of the most common types of inputs, chances are you'd pretty soon encounter a situation where you'd like to use your own custom component for editing certain fields. Lets say you want to create a form for for registering your coworkers and their favorite color in hex value (e.g. `#5A7174`. You may define your schema like this:

```js
const schema = Schema.compile({
  name: 'coworkers',
  types: [
    {
      name: 'coworker',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name of coworker'
        },
        {
          name: 'favoriteColor',
          type: 'string',
          title: 'Favorite color'
        }
      ]
    }
  ]
})
```

The `favoriteColor` field is a string as it should be, but you don't want to show the boring string input in the form where the user
 should select the color, instead you'd like to use [react-input-color](https://www.npmjs.com/package/react-input-color) for this field.
 
You could then create a tiny wrapper component that receives a value property, and emits a patch describing the change.

```js
// MyColorPicker.js
// ...
import React from 'react'
import PropTypes from 'prop-types' 
import InputColor from 'react-input-color'

export default class MyColorPicker extends React.Component {
  static propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    field: PropTypes.object
  };

  constructor(...args) {
    super(...args)
    this.handleChange = this.handleChange.bind(this)
  }
  handleChange(event) {
    this.props.onChange({patch: {$set: event.target.value}})
  }    
  render() {    
    return (
      <div>
        <label>{field.title}</label>
        <InputColor
          value={this.props.value}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}
```

Now that you have this component, you can then create a FormBuilder component providing a `resolveInputComponent` function that returns it for the `favoriteColor` field.
 
```js
import FormBuilder from '@sanity/form-builder'
import MyColorPicker from './MyColorPicker.js'

function resolveInputComponent(field) {
  if (field.name === 'favoriteColor') {
    return MyColorPicker
  }
}

function MyComponent() {
  return (
    <FormBuilder
     value={/*...*/}
     onChange={/*...*/}
     resolveInputComponent={resolveInputComponent} />
  )
}
``` 

Now the FormBuilder would render a color picker for the `favoriteColor` field on coworker
