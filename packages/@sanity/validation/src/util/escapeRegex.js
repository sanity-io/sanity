/* eslint-disable no-useless-escape */
module.exports = (string) => {
  // Escape ^$.*+-?=!:|\/()[]{},
  return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&')
}
