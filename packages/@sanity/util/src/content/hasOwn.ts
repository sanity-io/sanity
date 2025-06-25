const hasOwn: (thisArg: unknown, ...args: any[]) => unknown =
  Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty)

export default hasOwn
