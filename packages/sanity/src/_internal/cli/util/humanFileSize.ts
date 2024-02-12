function humanFileSize(size: number): string {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`
}

export default humanFileSize
