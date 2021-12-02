interface BabelFileResultWithOptions extends babel.BabelFileResult {
  options: {
    /**
     * Absolute path to the input file
     */
    filename: string
  }
}

export function _isBabelFileResultWithOptions(
  result: babel.BabelFileResult | BabelFileResultWithOptions
): result is BabelFileResultWithOptions {
  return 'options' in result && typeof result.options.filename === 'string'
}
