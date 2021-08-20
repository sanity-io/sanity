/* eslint-disable no-useless-escape */
export default (string: string): string => {
  // Escape ^$.*+-?=!:|\/()[]{},
  return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&')
}
