import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

export function useSettings() {
  return useLiveQuery(() => db.settings.get('settings'))
}
