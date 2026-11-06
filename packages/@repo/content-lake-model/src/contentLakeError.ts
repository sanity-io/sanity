export class ContentLakeError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ContentLakeError'
  }
}
