import { isMocking, isRecording } from '../utils'

export function createButtons() {
  const container = document.createElement('div')
  container.style.cssText =
    'position: fixed; top: 10px; right: 10px; z-index: 99999; display: flex; gap: 10px;'

  const recordBtn = document.createElement('button')
  recordBtn.textContent = isRecording() ? '⏹ Recording...' : '⏺ Record'
  recordBtn.style.cssText = `padding: 10px 15px; background: ${
    isRecording() ? '#ff0000' : '#ff4444'
  }; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`

  const mockBtn = document.createElement('button')
  mockBtn.textContent = isMocking() ? '✓ Mocking' : '🔄 Mock'
  mockBtn.style.cssText = `padding: 10px 15px; background: ${
    isMocking() ? '#0000ff' : '#4444ff'
  }; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`

  recordBtn.onclick = () => {
    const newIsRecording = !isRecording()
    localStorage.setItem('magic-mock-recording', newIsRecording.toString())
    recordBtn.style.background = isRecording() ? '#ff0000' : '#ff4444'
    recordBtn.textContent = isRecording() ? '⏹ Recording...' : '⏺ Record'
    console.log('Recording:', isRecording())
  }

  mockBtn.onclick = () => {
    const newIsMocking = !isMocking()
    localStorage.setItem('magic-mock-mocking', newIsMocking.toString())
    mockBtn.style.background = newIsMocking ? '#0000ff' : '#4444ff'
    mockBtn.textContent = newIsMocking ? '✓ Mocking' : '🔄 Mock'
    console.log('Mocking:', newIsMocking)
  }

  container.appendChild(recordBtn)
  container.appendChild(mockBtn)
  document.body.appendChild(container)
}
