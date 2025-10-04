import { openDB } from 'idb'
import type { Story } from '../types/story'

const DB_NAME = 'vixio-storyflow'
const STORY_STORE = 'story'

export async function saveStoryToIndexedDb(story: Story) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORY_STORE)) {
        db.createObjectStore(STORY_STORE)
      }
    },
  })
  await db.put(STORY_STORE, story, 'current')
}

export async function loadStoryFromIndexedDb(): Promise<Story | null> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORY_STORE)) {
        db.createObjectStore(STORY_STORE)
      }
    },
  })
  return (await db.get(STORY_STORE, 'current')) ?? null
}
