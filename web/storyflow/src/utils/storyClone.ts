export function cloneStory<T>(value: T): T {
  return value ? JSON.parse(JSON.stringify(value)) : value
}
