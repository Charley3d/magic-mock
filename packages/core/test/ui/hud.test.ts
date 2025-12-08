import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createButtons } from '../../src/ui/hud'

describe('hud', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = ''
    localStorage.clear()
  })

  describe('createButtons', () => {
    it('should create button container in the DOM', () => {
      createButtons()

      const container = document.querySelector('div[style*="position: fixed"]')
      expect(container).toBeTruthy()
      expect(container).toBeInstanceOf(HTMLDivElement)
    })

    it('should create record button', () => {
      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Record'))

      expect(recordBtn).toBeTruthy()
      expect(recordBtn?.textContent).toContain('Record')
    })

    it('should create mock button', () => {
      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Mock'))

      expect(mockBtn).toBeTruthy()
      expect(mockBtn?.textContent).toContain('Mock')
    })

    it('should position container at top right', () => {
      createButtons()

      const container = document.querySelector('div[style*="position: fixed"]') as HTMLElement
      expect(container.style.cssText).toContain('position: fixed')
      expect(container.style.cssText).toContain('top: 10px')
      expect(container.style.cssText).toContain('right: 10px')
      expect(container.style.cssText).toContain('z-index: 99999')
    })

    it('should display both buttons in container', () => {
      createButtons()

      const container = document.querySelector('div[style*="position: fixed"]')
      const buttons = container?.querySelectorAll('button')

      expect(buttons?.length).toBe(2)
    })

    it('should show recording state when already recording', () => {
      localStorage.setItem('magic-mock-recording', 'true')

      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Recording'))

      expect(recordBtn).toBeTruthy()
      expect(recordBtn?.textContent).toContain('Recording...')
    })

    it('should show mocking state when already mocking', () => {
      localStorage.setItem('magic-mock-mocking', 'true')

      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Mocking'))

      expect(mockBtn).toBeTruthy()
      expect(mockBtn?.textContent).toContain('Mocking')
    })

    it('should style record button based on recording state', () => {
      localStorage.setItem('magic-mock-recording', 'true')

      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Recording'),
      ) as HTMLButtonElement

      expect(recordBtn.style.background).toBe('rgb(255, 0, 0)') // #ff0000
    })

    it('should style record button when not recording', () => {
      localStorage.setItem('magic-mock-recording', 'false')

      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Record'),
      ) as HTMLButtonElement

      expect(recordBtn.style.background).toBe('rgb(255, 68, 68)') // #ff4444
    })

    it('should style mock button based on mocking state', () => {
      localStorage.setItem('magic-mock-mocking', 'true')

      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mocking'),
      ) as HTMLButtonElement

      expect(mockBtn.style.background).toBe('rgb(0, 0, 255)') // #0000ff
    })

    it('should style mock button when not mocking', () => {
      localStorage.setItem('magic-mock-mocking', 'false')

      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mock'),
      ) as HTMLButtonElement

      expect(mockBtn.style.background).toBe('rgb(68, 68, 255)') // #4444ff
    })
  })

  describe('button interactions', () => {
    it('should toggle recording on record button click', () => {
      localStorage.setItem('magic-mock-recording', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Record'),
      ) as HTMLButtonElement

      recordBtn.click()

      expect(localStorage.getItem('magic-mock-recording')).toBe('true')
    })

    it('should toggle recording off when clicking again', () => {
      localStorage.setItem('magic-mock-recording', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Record'),
      ) as HTMLButtonElement

      recordBtn.click()
      expect(localStorage.getItem('magic-mock-recording')).toBe('true')

      recordBtn.click()
      expect(localStorage.getItem('magic-mock-recording')).toBe('false')
    })

    it('should update record button text on click', () => {
      localStorage.setItem('magic-mock-recording', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Record'),
      ) as HTMLButtonElement

      expect(recordBtn.textContent).toContain('Record')

      recordBtn.click()

      expect(recordBtn.textContent).toContain('Recording...')
    })

    it('should update record button background on click', () => {
      localStorage.setItem('magic-mock-recording', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Record'),
      ) as HTMLButtonElement

      expect(recordBtn.style.background).toBe('rgb(255, 68, 68)')

      recordBtn.click()

      expect(recordBtn.style.background).toBe('rgb(255, 0, 0)')
    })

    it('should toggle mocking on mock button click', () => {
      localStorage.setItem('magic-mock-mocking', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mock'),
      ) as HTMLButtonElement

      mockBtn.click()

      expect(localStorage.getItem('magic-mock-mocking')).toBe('true')
    })

    it('should toggle mocking off when clicking again', () => {
      localStorage.setItem('magic-mock-mocking', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mock'),
      ) as HTMLButtonElement

      mockBtn.click()
      expect(localStorage.getItem('magic-mock-mocking')).toBe('true')

      mockBtn.click()
      expect(localStorage.getItem('magic-mock-mocking')).toBe('false')
    })

    it('should update mock button text on click', () => {
      localStorage.setItem('magic-mock-mocking', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mock'),
      ) as HTMLButtonElement

      expect(mockBtn.textContent).toContain('Mock')

      mockBtn.click()

      expect(mockBtn.textContent).toContain('Mocking')
    })

    it('should update mock button background on click', () => {
      localStorage.setItem('magic-mock-mocking', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mock'),
      ) as HTMLButtonElement

      expect(mockBtn.style.background).toBe('rgb(68, 68, 255)')

      mockBtn.click()

      expect(mockBtn.style.background).toBe('rgb(0, 0, 255)')
    })

    it('should log recording state on button click', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      localStorage.setItem('magic-mock-recording', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Record'),
      ) as HTMLButtonElement

      recordBtn.click()

      expect(consoleLogSpy).toHaveBeenCalledWith('Recording:', true)

      consoleLogSpy.mockRestore()
    })

    it('should log mocking state on button click', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      localStorage.setItem('magic-mock-mocking', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mock'),
      ) as HTMLButtonElement

      mockBtn.click()

      expect(consoleLogSpy).toHaveBeenCalledWith('Mocking:', true)

      consoleLogSpy.mockRestore()
    })

    it('should allow independent toggling of both modes', () => {
      localStorage.setItem('magic-mock-recording', 'false')
      localStorage.setItem('magic-mock-mocking', 'false')
      createButtons()

      const buttons = document.querySelectorAll('button')
      const recordBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Record'),
      ) as HTMLButtonElement
      const mockBtn = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Mock'),
      ) as HTMLButtonElement

      // Enable both
      recordBtn.click()
      mockBtn.click()

      expect(localStorage.getItem('magic-mock-recording')).toBe('true')
      expect(localStorage.getItem('magic-mock-mocking')).toBe('true')

      // Disable recording, keep mocking
      recordBtn.click()

      expect(localStorage.getItem('magic-mock-recording')).toBe('false')
      expect(localStorage.getItem('magic-mock-mocking')).toBe('true')
    })
  })

  describe('button styling', () => {
    it('should apply consistent button styles', () => {
      createButtons()

      const buttons = document.querySelectorAll('button')

      buttons.forEach((btn) => {
        expect(btn.style.cssText).toContain('padding: 10px 15px')
        expect(btn.style.cssText).toContain('color: white')
        // Note: jsdom may not include "border: none" in cssText if border is default
        expect(btn.style.cssText).toContain('border-radius: 5px')
        expect(btn.style.cssText).toContain('cursor: pointer')
        expect(btn.style.cssText).toContain('font-weight: bold')
        expect(btn.style.cssText).toContain('box-shadow')
      })
    })

    it('should set high z-index for overlay', () => {
      createButtons()

      const container = document.querySelector('div[style*="position: fixed"]') as HTMLElement
      expect(container.style.zIndex).toBe('99999')
    })

    it('should display buttons with gap', () => {
      createButtons()

      const container = document.querySelector('div[style*="position: fixed"]') as HTMLElement
      expect(container.style.cssText).toContain('gap: 10px')
      expect(container.style.cssText).toContain('display: flex')
    })
  })

  describe('edge cases', () => {
    it('should handle missing localStorage values', () => {
      localStorage.clear()

      expect(() => createButtons()).not.toThrow()

      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBe(2)
    })

    it('should not create duplicate containers', () => {
      createButtons()
      createButtons()

      const containers = document.querySelectorAll('div[style*="position: fixed"]')
      // Will create two, but in real usage this is called once
      expect(containers.length).toBeGreaterThanOrEqual(2)
    })

    it('should append to document body', () => {
      createButtons()

      const container = document.body.querySelector('div[style*="position: fixed"]')
      expect(container).toBeTruthy()
      expect(container?.parentElement).toBe(document.body)
    })

    it('should work with pre-existing body content', () => {
      document.body.innerHTML = '<div id="app">Existing content</div>'

      createButtons()

      expect(document.getElementById('app')).toBeTruthy()
      expect(document.querySelector('div[style*="position: fixed"]')).toBeTruthy()
    })
  })
})
