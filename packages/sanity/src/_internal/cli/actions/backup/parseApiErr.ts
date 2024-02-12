// apiErr is a type that represents an error returned by the API
interface ApiErr {
  statusCode: number
  message: string
}

// parseApiErr is a function that attempts with the best effort to parse
// an error returned by the API since different API endpoint may end up
// returning different error structures.
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
function parseApiErr(err: any): ApiErr {
  const apiErr = {} as ApiErr
  if (err.code) {
    apiErr.statusCode = err.code
  } else if (err.statusCode) {
    apiErr.statusCode = err.statusCode
  }

  if (err.message) {
    apiErr.message = err.message
  } else if (err.statusMessage) {
    apiErr.message = err.statusMessage
  } else if (err?.response?.body?.message) {
    apiErr.message = err.response.body.message
  } else if (err?.response?.data?.message) {
    apiErr.message = err.response.data.message
  } else {
    // If no message can be extracted, print the whole error.
    apiErr.message = JSON.stringify(err)
  }

  return apiErr
}

export default parseApiErr
