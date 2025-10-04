import { test, expect } from '@playwright/test'
import { primeStoryflowRoutes } from '../setup/loadStory'

async function loadStoryflow(page) {
  await primeStoryflowRoutes(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForSelector('button:has-text("Timeline Overlay")', { timeout: 15000 })
}

test.describe('Storyflow board', () => {
  test('renders flow view and switches tabs', async ({ page }) => {
    await loadStoryflow(page)

    const nodeCount = await page.locator('.react-flow__node').count()
    expect(nodeCount).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Timeline Overlay' }).click()
    await expect(page.getByText('Timeline Overlay Preview')).toBeVisible()

    await page.getByRole('button', { name: 'Scene Strips' }).click()
    await expect(page.getByText('Scene Strips Preview')).toBeVisible()
  })

  test('saves story via keyboard shortcut', async ({ page }) => {
    await loadStoryflow(page)

    await page.route('**/story', (route, request) => {
      if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'saved' }),
        })
      } else {
        route.continue()
      }
    })

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+S' : 'Control+S')
    await expect(page.getByText('Story saved')).toBeVisible()
  })

  test('publishes story and shows summary dialog', async ({ page }) => {
    await loadStoryflow(page)

    await page.route('**/story/publish', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: 12, warnings: ['Cue \'cue-bgm\' missing fade-out'] }),
      })
    })

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+P' : 'Control+P')
    await expect(page.getByRole('dialog', { name: 'Publish Summary' })).toBeVisible()
    await expect(page.getByText('Warnings')).toBeVisible()
  })

  test('toggles collaboration state', async ({ page }) => {
    await loadStoryflow(page)
    const collabButton = page.getByRole('button', { name: /Collab/ })
    await collabButton.click()
    await expect(collabButton).toHaveAttribute('aria-pressed', 'true')
  })
})
