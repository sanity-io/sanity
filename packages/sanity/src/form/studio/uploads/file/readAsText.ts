import {Observable} from 'rxjs'

export function readAsText(file: File) {
  return new Observable((observer) => {
    const reader = new FileReader()
    reader.onerror = (error) => observer.error(error)
    reader.onload = () => {
      observer.next(reader.result)
      observer.complete()
    }
    reader.readAsText(file)
    return () => {
      reader.abort()
    }
  })
}
