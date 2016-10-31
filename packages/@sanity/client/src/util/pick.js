module.exports = (obj, props) =>
  props.reduce((selection, prop) => {
    if (typeof obj[prop] === 'undefined') {
      return selection
    }

    selection[prop] = obj[prop]
    return selection
  }, {})
