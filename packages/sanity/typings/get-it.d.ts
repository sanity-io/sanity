declare module 'get-it' {
  const getIt: any
  export default getIt
}

declare module 'get-it/middleware' {
  const promise: any
  export {promise}
}

declare module 'get-it/lib/middleware/promise' {
  const promise: () => any
  export default promise
}
