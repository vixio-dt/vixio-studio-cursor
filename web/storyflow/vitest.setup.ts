import '@total-typescript/ts-reset'
import '@testing-library/jest-dom'

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined') {
  ;(window as any).ResizeObserver = ResizeObserver
  ;(globalThis as any).ResizeObserver = ResizeObserver
}
