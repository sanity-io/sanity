module.exports = (obj, props) =>
  Object.keys(obj).reduce((selection, prop) => {
    if (props.indexOf(prop) !== -1) {
      return selection
    }

    selection[prop] = obj[prop]
    return selection
  }, {})
