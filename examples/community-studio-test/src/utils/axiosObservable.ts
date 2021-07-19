import axios, {AxiosRequestConfig, AxiosResponse} from 'axios'
import {Observable} from 'rxjs'

export interface AxiosObservable<T = any> extends Observable<AxiosResponse<T>> {}

function _axiosObservable<T>(config: AxiosRequestConfig): Observable<AxiosResponse<T>> {
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()

  return new Observable(subscriber => {
    const req = axios(config)
    req.then(
      response => {
        subscriber.next(response)
        subscriber.complete()
      },
      error => {
        subscriber.error(error)
      },
    )
    return () => {
      source.cancel()
    }
  })
}

export function axiosObservable<T>(config: AxiosRequestConfig): AxiosObservable<T>
export function axiosObservable<T>(url: string, config?: AxiosRequestConfig): AxiosObservable<T>
export function axiosObservable<T>(
  first: string | AxiosRequestConfig,
  second?: AxiosRequestConfig,
): AxiosObservable<T> {
  return _axiosObservable<T>(typeof first === 'string' ? {...(second || {}), url: first} : first)
}
