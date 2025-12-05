import { overrideFetch } from './override/fetch'
import { overrideXHR } from './override/xhr'
import { createButtons } from './ui/hud'

declare const __STANDALONE__: boolean

export function initMagicMock() {
  overrideFetch()
  overrideXHR()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButtons)
  } else {
    createButtons()
  }
}

if (!__STANDALONE__) {
  initMagicMock()
}
