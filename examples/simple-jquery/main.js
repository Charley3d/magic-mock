import { initMagicMock } from './client-script.js'

$(document).ready(function () {
  initMagicMock()
  $('#fetchButton').click(function () {
    const startTime = performance.now()

    // Disable button during request
    $(this).prop('disabled', true).text('Fetching...')

    // Clear previous results
    $('#result').hide()
    $('#events').empty()

    $.ajax({
      url: 'https://api.github.com/repos/facebook/react/events?per_page=500',
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        const endTime = performance.now()
        const rtt = Math.round(endTime - startTime)

        // Display RTT
        $('#rtt').text(`RTT: ${rtt}ms`)

        // Display events
        data.forEach(function (event) {
          const eventDiv = $('<div class="event"></div>')
          eventDiv.html(`
            <strong>${event.type}</strong> by ${event.actor.login}<br>
            <small>Repository: ${event.repo.name}</small><br>
            <small>Created: ${new Date(event.created_at).toLocaleString()}</small>
          `)
          $('#events').append(eventDiv)
        })

        $('#result').show()
        console.log('Fetched', data.length, 'events in', rtt, 'ms')
      },
      error: function (xhr, status, error) {
        const endTime = performance.now()
        const rtt = Math.round(endTime - startTime)

        $('#rtt').text(`RTT: ${rtt}ms (Error)`)
        $('#events').html(`<div class="event" style="border-left-color: #cc0000;">
          <strong>Error:</strong> ${error}<br>
          <small>Status: ${status}</small><br>
          <small>Response: ${xhr.responseText}</small>
        </div>`)

        $('#result').show()
        console.error('Error fetching events:', error)
      },
      complete: function () {
        // Re-enable button
        $('#fetchButton').prop('disabled', false).text('Fetch GitHub Events')
      },
    })
  })
})
