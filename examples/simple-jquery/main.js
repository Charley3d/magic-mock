import { initMagicMock } from './client-script.js'

// List of random Pokemon names to fetch
const POKEMON_NAMES = [
  'pikachu',
  'charizard',
  'bulbasaur',
  'squirtle',
  'mewtwo',
  'eevee',
  'snorlax',
  'dragonite',
  'gengar',
  'gyarados',
  'lapras',
  'vaporeon',
  'jolteon',
  'flareon',
  'mew',
  'articuno',
  'zapdos',
  'moltres',
  'ditto',
  'meowth',
  'psyduck',
  'jigglypuff',
  'alakazam',
  'machamp',
  'golem',
  'slowpoke',
  'magneton',
  'farfetchd',
  'dodrio',
  'dewgong',
  'muk',
  'cloyster',
  'haunter',
  'onix',
  'hypno',
  'kingler',
  'electrode',
  'exeggutor',
  'marowak',
  'hitmonlee',
  'hitmonchan',
  'lickitung',
  'weezing',
  'rhydon',
  'chansey',
  'tangela',
  'kangaskhan',
  'seadra',
  'seaking',
  'starmie',
  'scyther',
]

$(document).ready(function () {
  initMagicMock()

  $('#fetchButton').click(async function () {
    const count = parseInt($('#pokemonCount').val())
    const startTime = performance.now()

    // Disable controls during request
    $('#fetchButton').prop('disabled', true).text('Fetching...')
    $('#pokemonCount').prop('disabled', true)

    // Clear previous results
    $('#result').hide()
    $('#pokemonList').empty()

    // Select random Pokemon from our list
    const selectedPokemon = POKEMON_NAMES.slice(0, count)

    try {
      // Fetch Pokemon sequentially (one at a time) to demonstrate dramatic performance difference
      // Recording mode: ~200ms per Pokemon × 50 = ~10 seconds
      // Mocking mode: ~2ms per Pokemon × 50 = ~100ms
      const responses = []
      for (const name of selectedPokemon) {
        const pokemon = await $.ajax({
          url: `https://pokeapi.co/api/v2/pokemon/${name}`,
          method: 'GET',
          dataType: 'json',
        })
        responses.push(pokemon)

        // Progressive UI update: show Pokemon as they load
        const card = createPokemonCard(pokemon)
        $('#pokemonList').append(card)
      }

      const endTime = performance.now()
      const rtt = Math.round(endTime - startTime)

      // Display stats
      $('#count').text(`Pokemon Loaded: ${responses.length}`)
      $('#rtt').text(`Total Time: ${rtt}ms (${Math.round(rtt / responses.length)}ms avg per Pokemon)`)

      $('#result').show()
    } catch (error) {
      const endTime = performance.now()
      const rtt = Math.round(endTime - startTime)

      $('#count').text('Error occurred')
      $('#rtt').text(`Time: ${rtt}ms`)

      const errorDiv = $('<div class="error"></div>')
      errorDiv.html(`
        <strong>Error:</strong> ${error.statusText || error.message}<br>
        <small>Status: ${error.status || 'Network Error'}</small>
      `)
      $('#pokemonList').append(errorDiv)

      $('#result').show()
    } finally {
      // Re-enable controls
      $('#fetchButton').prop('disabled', false).text('Fetch Pokemon')
      $('#pokemonCount').prop('disabled', false)
    }
  })
})

function createPokemonCard(pokemon) {
  const card = $('<div class="pokemon-card"></div>')

  const sprite = pokemon.sprites.front_default || pokemon.sprites.front_shiny || ''
  const typeBadges = pokemon.types
    .map(function (t) {
      return `<span class="type-badge" style="background-color: ${getTypeColor(t.type.name)}">${t.type.name}</span>`
    })
    .join('')

  card.html(`
    <img src="${sprite}" alt="${pokemon.name}">
    <div class="pokemon-name">${pokemon.name}</div>
    <div class="pokemon-types">
      ${typeBadges}
    </div>
    <div style="margin-top: 8px; font-size: 14px; color: #666;">
      Height: ${pokemon.height} | Weight: ${pokemon.weight}
    </div>
  `)

  return card
}

function getTypeColor(type) {
  const colors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  }
  return colors[type] || '#888'
}
