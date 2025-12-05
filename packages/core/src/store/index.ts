import { LocalStore } from './LocalStore'
import { RemoteStore } from './RemoteStore'
import { Store } from './Store'

declare const __STANDALONE__: boolean
export const storage = __STANDALONE__ ? new LocalStore() : new RemoteStore()

export const createStore: () => Store = () => {
  return __STANDALONE__ ? new LocalStore() : new RemoteStore()
}
