export function prettifyQuotaError(message: string) {
  return (err: Error & {statusCode?: number}): Error & {statusCode?: number} => {
    if (err.statusCode === 402) {
      err.message = message
      throw err
    }

    throw err
  }
}
