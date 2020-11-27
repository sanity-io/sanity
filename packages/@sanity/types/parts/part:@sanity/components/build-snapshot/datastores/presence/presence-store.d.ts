import {Observable} from 'rxjs'
import {DocumentPresence, GlobalPresence, PresenceLocation} from './types'
export declare const SESSION_ID: any
export declare const setLocation: (nextLocation: PresenceLocation[]) => void
export declare const reportLocations: (locations: PresenceLocation[]) => Observable<void>
export declare const globalPresence$: Observable<GlobalPresence[]>
export declare const documentPresence: (documentId: string) => Observable<DocumentPresence[]>
