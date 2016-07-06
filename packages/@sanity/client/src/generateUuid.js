/* eslint-disable no-bitwise */
function generateUuid() {
  let date = Date.now()
  if (window.performance && typeof window.performance.now === 'function') {
    date += performance.now()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const rad = (date + Math.random() * 16) % 16 | 0
    date = Math.floor(date / 16)
    return (char == 'x' ? rad : (rad & 0x3 | 0x8)).toString(16)
  })
}
/* eslint-enable no-bitwise */

export default generateUuid
