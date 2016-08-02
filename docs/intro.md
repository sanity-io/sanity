# Sanity form-builder

# Highlights

## Simple
The Form Builder is modelled as a *[controlled component](https://facebook.github.io/react/docs/forms.html#controlled-components)* and does not maintain its own state. It simply receives its value as a `prop` and emits the a patch describing the change to a provided `onChange` method. It is up to the consumer to apply the patch and pass the new value back to the `value` prop of the FormBuilder component. This is a really simple model, that usually makes it easier to reason about state changes.

## Powerful
Despite its simple model, the Form Builder supports editing deeply nested JSON structures with arrays and complex properties. Its also possible to insert references to other documents by providing a few methods for looking up data from your backend's data store  

## Collaboration-ready
Whenever the user makes changes in the generated form, the `onChange` handler is called with an event describing the operation that was done, not the complete new version of the document. This patch can either be applied locally or be sent to a central server that orchestrates updates from other clients and distributes changes back. These patches describe exactly what was changed and where the change happened.

## Performant
Each input component may choose its own optimal way of representing its edited value and deciding on how to apply patches in the most efficient way. E.g. an input component for HTML may want to deserialize the initial HTML string into a more efficient structure than a plain string. Whenever the user changes something, the input element may formulate patches as `change the innerHTML of div[0] a[4] to "click me!"`, or `change the href attribute of div[3] p[2] to http://foo.com`, which would be more efficient than just `change my value to <this big blob of HTML>`. 

## Flexible and customizable
The Form Builder comes with a default set of the most common form input components that you would expect (checkbox, text input, dropdown etc.). If you have special requirements or need a completely unique and special form input for your organization, or you want to replace the default checkbox with your own magic-awesome-unicorn-checkbox component you can do so with a few lines of code.
 <!-- point to example --> 