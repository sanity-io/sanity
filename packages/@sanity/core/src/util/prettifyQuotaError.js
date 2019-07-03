module.exports = message => err => {
  if (err.statusCode === 402) {
    err.message = message
    throw err
  }

  throw err
}
