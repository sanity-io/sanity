const BOOL_PROPS = {
  defaultChecked: 'isDefaultChecked',
  autoFocus: 'hasAutoFocus',
  checked: 'isChecked',
  disabled: 'isDisabled',
  draggable: 'isDraggable',
  multiple: 'isMultiple',
  readOnly: 'isReadOnly',
  required: 'isRequired '
}

const BOOL_PROP_KEYS = Object.keys(BOOL_PROPS)

export default function warnOnNativeBoolProps(instance, props) {
  BOOL_PROP_KEYS.forEach(propName => {
    if (propName in props) {
      console.warn(
        'Invalid boolean attribute "%s" passed to component %s. Use "%s" instead.',
        propName,
        instance.constructor.displayName || instance.constructor.name,
        BOOL_PROPS[propName]
      )
    }
  })
}
