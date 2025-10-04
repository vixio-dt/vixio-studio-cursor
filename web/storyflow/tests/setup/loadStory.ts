import { mockStory } from '../../src/data/mockStory'

export async function primeStoryflowRoutes(page) {
  await page.route('**/story', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStory) })
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    }
  })

  await page.route('**/timeline', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ fps: 30, events: [] }),
    }),
  )
}
