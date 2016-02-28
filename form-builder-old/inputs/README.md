# This folder contains a collection of input widgets that can be used to obtain kinds of user supplied values / changes.

All components take a `value` property, that if supplied will be used to render the current value. In addition, the
components also provides an onChange event, that will be called with the new/changed value. It is up to the owner to respond
to changes and write the new values back to each component's `value`-property

Important: No form-builder logic should be added to components in this folder. We should also try to keep bindings to
other parts of sanity at a bare minimum, so that we can easily extract components here and re-use in other contexts.

## Example

```js
// Should work for all components in this folder
import SomeInput from "./inputs/SomeInput";

const SomeComponent = React.createClass({

  getInitialState() {
    return {valueofSomeInput: {}}
  },

  handleSomeInputChange(newValue) {
    this.setState({valueOfSomeInput: newValue});
  },

  render() {
    return (
      <div>
        <h1>Edit somevalue</h1>
        <SomeInput value={this.state.valueOfSomeInput} onChange={this.handleSomeInputChange}/>
      </div>
    );
  }
});

```
