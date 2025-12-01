import { initMagicMock } from './client-script.js'

document.addEventListener('DOMContentLoaded', function () {
  initMagicMock()
  
  const fetchButton = document.getElementById('fetchButton')
  const resultDiv = document.getElementById('result')
  const rttDiv = document.getElementById('rtt')
  const eventsDiv = document.getElementById('events')
  
  fetchButton.addEventListener('click', function () {
    const startTime = performance.now()

    // Disable button during request
    fetchButton.disabled = true
    fetchButton.textContent = 'Fetching...'

    // Clear previous results
    resultDiv.style.display = 'none'
    eventsDiv.innerHTML = ''

    axios.get('https://api.github.com/repos/facebook/react/events?per_page=500')
      .then(function (response) {
        const endTime = performance.now()
        const rtt = Math.round(endTime - startTime)
        const data = response.data

        // Display RTT
        rttDiv.textContent = `RTT: ${rtt}ms`

        // Display events
        data.forEach(function (event) {
          const eventDiv = document.createElement('div')
          eventDiv.className = 'event'
          eventDiv.innerHTML = `
            <strong>${event.type}</strong> by ${event.actor.login}<br>
            <small>Repository: ${event.repo.name}</small><br>
            <small>Created: ${new Date(event.created_at).toLocaleString()}</small>
          `
          eventsDiv.appendChild(eventDiv)
        })

        resultDiv.style.display = 'block'
        console.log('Fetched', data.length, 'events in', rtt, 'ms')
      })
      .catch(function (error) {
        const endTime = performance.now()
        const rtt = Math.round(endTime - startTime)

        rttDiv.textContent = `RTT: ${rtt}ms (Error)`
        
        const errorDiv = document.createElement('div')
        errorDiv.className = 'event'
        errorDiv.style.borderLeftColor = '#cc0000'
        errorDiv.innerHTML = `
          <strong>Error:</strong> ${error.message}<br>
          <small>Status: ${error.response ? error.response.status : 'Network Error'}</small><br>
          <small>Response: ${error.response ? error.response.data : error.message}</small>
        `
        eventsDiv.appendChild(errorDiv)

        resultDiv.style.display = 'block'
        console.error('Error fetching events:', error)
      })
      .finally(function () {
        // Re-enable button
        fetchButton.disabled = false
        fetchButton.textContent = 'Fetch GitHub Events'
      })
  })
})
