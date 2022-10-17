import {Observable} from 'rxjs'

export function readAsText(file: File, encoding?: string) {
  return new Observable<string | null>((observer) => {
    const reader = new FileReader()
    reader.onerror = (error) => observer.error(error)
    reader.onload = () => {
      observer.next(reader.result as string | null)
      observer.complete()
    }
    reader.readAsText(file, encoding)
    return () => {
      reader.abort()
    }
  })
}
