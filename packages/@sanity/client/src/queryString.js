const encode = param => encodeURIComponent(param)

function queryString(params) {
  const reduceQueryParam = (qs, param) =>
    qs.concat(`${encode(param)}=${encode(params[param])}`)

  return Object.keys(params).reduce(reduceQueryParam, []).join('&')
}

export default {
  stringify: queryString
}
