<script setup lang="ts">
import { ref } from 'vue'

interface Pokemon {
  id: number
  name: string
  sprites: {
    front_default: string
  }
  types: Array<{
    type: {
      name: string
    }
  }>
  height: number
  weight: number
}

interface Stats {
  count: number
  totalTime: number
  avgTime: number
}

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

const pokemonList = ref<Pokemon[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pokemonCount = ref(5)
const stats = ref<Stats>({ count: 0, totalTime: 0, avgTime: 0 })
const showResult = ref(false)

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
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

const fetchPokemon = async () => {
  loading.value = true
  error.value = null
  showResult.value = false
  pokemonList.value = []

  const startTime = performance.now()
  const count = pokemonCount.value
  const selectedPokemon = POKEMON_NAMES.slice(0, count)

  try {
    // Fetch Pokemon sequentially (one at a time) to demonstrate dramatic performance difference
    // Recording mode: ~200ms per Pokemon × 50 = ~10 seconds
    // Mocking mode: ~2ms per Pokemon × 50 = ~100ms
    const results: Pokemon[] = []
    for (const name of selectedPokemon) {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const pokemon = await res.json()
      results.push(pokemon)

      // Progressive UI update: show Pokemon as they load
      pokemonList.value = [...results]
    }

    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)

    pokemonList.value = results
    stats.value = {
      count: results.length,
      totalTime,
      avgTime: Math.round(totalTime / results.length),
    }
    showResult.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
    showResult.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app">
    <h1>Magic Mock - Pokemon Explorer</h1>
    <p>Select how many Pokemon to fetch and see the magic-mock performance difference!</p>

    <div class="controls">
      <label for="pokemonCount">Number of Pokemon:</label>
      <select id="pokemonCount" v-model.number="pokemonCount" :disabled="loading">
        <option :value="1">1</option>
        <option :value="5">5</option>
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>
      <button @click="fetchPokemon" :disabled="loading">
        {{ loading ? 'Fetching...' : 'Fetch Pokemon' }}
      </button>
    </div>

    <div v-if="showResult" class="result">
      <div class="stats">
        <span>Pokemon Loaded: {{ stats.count }}</span>
        <span>Total Time: {{ stats.totalTime }}ms ({{ stats.avgTime }}ms avg per Pokemon)</span>
      </div>

      <div v-if="error" class="error"><strong>Error:</strong> {{ error }}</div>

      <div v-else class="pokemon-grid">
        <div v-for="pokemon in pokemonList" :key="pokemon.id" class="pokemon-card">
          <img :src="pokemon.sprites.front_default" :alt="pokemon.name" />
          <div class="pokemon-name">{{ pokemon.name }}</div>
          <div class="pokemon-types">
            <span
              v-for="type in pokemon.types"
              :key="type.type.name"
              class="type-badge"
              :style="{ backgroundColor: getTypeColor(type.type.name) }"
            >
              {{ type.type.name }}
            </span>
          </div>
          <div style="margin-top: 8px; font-size: 14px; color: #666">
            Height: {{ pokemon.height }} | Weight: {{ pokemon.weight }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 900px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #333;
}

p {
  color: #666;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
}

label {
  font-size: 16px;
  font-weight: bold;
}

select {
  padding: 10px 20px;
  font-size: 16px;
  border: 2px solid #0066cc;
  border-radius: 5px;
  background-color: white;
  cursor: pointer;
}

button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0052a3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  text-align: left;
}

.stats {
  font-weight: bold;
  color: #0066cc;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 2px solid #0066cc;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.pokemon-card {
  padding: 15px;
  border: 2px solid #0066cc;
  border-radius: 8px;
  background-color: #fff;
  text-align: center;
}

.pokemon-card img {
  width: 100px;
  height: 100px;
  margin-bottom: 10px;
}

.pokemon-name {
  font-weight: bold;
  font-size: 18px;
  text-transform: capitalize;
  margin-bottom: 5px;
}

.pokemon-types {
  display: flex;
  justify-content: center;
  gap: 5px;
  flex-wrap: wrap;
}

.type-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.error {
  color: #cc0000;
  padding: 15px;
  border: 2px solid #cc0000;
  border-radius: 5px;
  background-color: #ffe6e6;
}
</style>
