
const primitives = 'string number boolean reference list date'
  .split(' ')
  .reduce((result, typename) => {
    result[typename] = {
      name: typename,
      primitive: true
    }
    return result
  }, {})


export default primitives
