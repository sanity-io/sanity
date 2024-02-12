import {Readable} from 'node:stream'

import {type QueryParams, type SanityClient} from '@sanity/client'

type File = {
  name: string
  url: string
  type: string
}

type GetBackupResponse = {
  createdAt: string
  totalFiles: number
  files: File[]
  nextCursor?: string
}

class PaginatedGetBackupStream extends Readable {
  private cursor = ''
  private readonly client: SanityClient
  private readonly projectId: string
  private readonly datasetName: string
  private readonly backupId: string
  private readonly token: string
  public totalFiles = 0

  constructor(
    client: SanityClient,
    projectId: string,
    datasetName: string,
    backupId: string,
    token: string,
  ) {
    super({objectMode: true})
    this.client = client
    this.projectId = projectId
    this.datasetName = datasetName
    this.backupId = backupId
    this.token = token
  }

  async _read(): Promise<void> {
    try {
      const data = await this.fetchNextBackupPage()

      // Set totalFiles when it's fetched for the first time
      if (this.totalFiles === 0) {
        this.totalFiles = data.totalFiles
      }

      data.files.forEach((file: File) => this.push(file))

      if (typeof data.nextCursor === 'string' && data.nextCursor !== '') {
        this.cursor = data.nextCursor
      } else {
        // No more pages left to fetch.
        this.push(null)
      }
    } catch (err) {
      this.destroy(err as Error)
    }
  }

  // fetchNextBackupPage fetches the next page of backed up files from the backup API.
  async fetchNextBackupPage(): Promise<GetBackupResponse> {
    const query: QueryParams = this.cursor === '' ? {} : {nextCursor: this.cursor}

    try {
      return await this.client.request({
        headers: {Authorization: `Bearer ${this.token}`},
        uri: `/projects/${this.projectId}/datasets/${this.datasetName}/backups/${this.backupId}`,
        query,
      })
    } catch (error) {
      // It can be clearer to pull this logic out in a  common error handling function for re-usability.
      let msg = error.statusCode ? error.response.body.message : error.message

      // If no message can be extracted, print the whole error.
      if (msg === undefined) {
        msg = String(error)
      }
      throw new Error(`Downloading dataset backup failed: ${msg}`)
    }
  }
}

export {PaginatedGetBackupStream}
export type {File, GetBackupResponse}
