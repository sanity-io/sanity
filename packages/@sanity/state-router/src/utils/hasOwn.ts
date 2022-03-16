const _hasOWn = Object.prototype.hasOwnProperty

export const hasOwn = _hasOWn.call.bind(_hasOWn)
