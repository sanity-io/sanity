# The FormBuilder Component

## Props
- **`value`** - required. The current form builder value. It should always be an instance of FormBuilderValue
- **`onChange`** - required. This is the function that will be called whenever the value changes. 
- **`schema`** - required, instance of `Schema`. The schema to use when building the form. This can be provided either as a prop, or specified as an option to `createFormBuilder(...)`

Handling changes