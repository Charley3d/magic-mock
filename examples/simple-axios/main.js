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

document.addEventListener('DOMContentLoaded', function () {
  initMagicMock()

  const fetchButton = document.getElementById('fetchButton')
  const pokemonCountSelect = document.getElementById('pokemonCount')
  const resultDiv = document.getElementById('result')
  const countDiv = document.getElementById('count')
  const rttDiv = document.getElementById('rtt')
  const pokemonListDiv = document.getElementById('pokemonList')

  fetchButton.addEventListener('click', async function () {
    const count = parseInt(pokemonCountSelect.value)
    const startTime = performance.now()

    // Disable controls during request
    fetchButton.disabled = true
    pokemonCountSelect.disabled = true
    fetchButton.textContent = 'Fetching...'

    // Clear previous results
    resultDiv.style.display = 'none'
    pokemonListDiv.innerHTML = ''

    // Select random Pokemon from our list
    const selectedPokemon = POKEMON_NAMES.slice(0, count)

    try {
      // Fetch Pokemon sequentially (one at a time) to demonstrate dramatic performance difference
      // Recording mode: ~200ms per Pokemon × 50 = ~10 seconds
      // Mocking mode: ~2ms per Pokemon × 50 = ~100ms
      const responses = []
      for (const name of selectedPokemon) {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`)
        responses.push(response)

        // Progressive UI update: show Pokemon as they load
        const pokemon = response.data
        const card = createPokemonCard(pokemon)
        pokemonListDiv.appendChild(card)
      }

      const endTime = performance.now()
      const rtt = Math.round(endTime - startTime)

      // Display stats
      countDiv.textContent = `Pokemon Loaded: ${responses.length}`
      rttDiv.textContent = `Total Time: ${rtt}ms (${Math.round(rtt / responses.length)}ms avg per Pokemon)`

      resultDiv.style.display = 'block'
    } catch (error) {
      const endTime = performance.now()
      const rtt = Math.round(endTime - startTime)

      countDiv.textContent = 'Error occurred'
      rttDiv.textContent = `Time: ${rtt}ms`

      const errorDiv = document.createElement('div')
      errorDiv.className = 'error'
      errorDiv.innerHTML = `
        <strong>Error:</strong> ${error.message}<br>
        <small>Status: ${error.response ? error.response.status : 'Network Error'}</small>
      `
      pokemonListDiv.appendChild(errorDiv)

      resultDiv.style.display = 'block'
    } finally {
      // Re-enable controls
      fetchButton.disabled = false
      pokemonCountSelect.disabled = false
      fetchButton.textContent = 'Fetch Pokemon'
    }
  })
})

function createPokemonCard(pokemon) {
  const card = document.createElement('div')
  card.className = 'pokemon-card'

  const sprite = pokemon.sprites.front_default || pokemon.sprites.front_shiny || ''
  const types = pokemon.types.map((t) => t.type.name).join(', ')

  card.innerHTML = `
    <img src="${sprite}" alt="${pokemon.name}">
    <div class="pokemon-name">${pokemon.name}</div>
    <div class="pokemon-types">
      ${pokemon.types
        .map(
          (t) => `<span class="type-badge" style="background-color: ${getTypeColor(t.type.name)}">${t.type.name}</span>`
        )
        .join('')}
    </div>
    <div style="margin-top: 8px; font-size: 14px; color: #666;">
      Height: ${pokemon.height} | Weight: ${pokemon.weight}
    </div>
  `

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
