import {Subscription} from 'rxjs'

export function request(comp: any, opts: any, key: any): Subscription {
  return comp.context.client.observable.request(opts).subscribe({
    next: (val: any) => comp.setState({[key]: val}),
    error: (error: Error) => comp.setState({error}),
  })
}
