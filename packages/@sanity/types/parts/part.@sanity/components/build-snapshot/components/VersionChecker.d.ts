import type {PureComponent} from 'react'
interface VersionsResponse {
  hash?: string
  result: {
    isSupported: boolean
    isUpToDate: boolean
    outdated?: {
      name: string
      version: string
      latest: string
    }[]
    message?: string
    helpUrl?: string
  }
}
declare class VersionChecker extends PureComponent<
  Record<string, unknown>,
  {
    result?: Omit<VersionsResponse['result'], 'outdated'>
  }
> {
  static checkVersions: (options?: {getOutdated?: boolean}) => Promise<VersionsResponse>
  static getLatestInstalled: () => any
  checkTimeout?: number
  constructor(props: any)
  onResponse(res: VersionsResponse): void
  handleClose(): void
  componentDidMount(): void
  componentWillUnmount(): void
  render(): JSX.Element
}
export default VersionChecker
