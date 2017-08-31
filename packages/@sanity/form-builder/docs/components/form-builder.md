# The FormBuilder Component

The `FormBuilder` component is responsible for rendering the generated form and takes the following props:

## Props
- **`value`** - required. The current form builder value. It should always be an instance of FormBuilderValue
- **`onChange`** - required. This is the function that will be called whenever a change happens. The change must be applied for it to update the form field. If the change is not applied the form will effectively be read-only.
- **`validation`** - optional. An instance of `ValidationResult`
