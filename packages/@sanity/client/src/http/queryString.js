module.exports = (params) => {
  const qs = []
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    }
  }

  return qs.length > 0 ? `?${qs.join('&')}` : ''
}
