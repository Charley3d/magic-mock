<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Pokemon {
  name: string
  sprites: {
    front_default: string
  }
  types: Array<{
    type: {
      name: string
    }
  }>
}

const pokemon = ref<Pokemon | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const fetchPokemon = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/ditto')
    if (!response.ok) throw new Error('Failed to fetch')
    pokemon.value = await response.json()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPokemon()
})
</script>

<template>
  <div class="app">
    <h1>🎩 Magic Mock Demo</h1>

    <div class="instructions">
      <p>
        <strong>How to use:</strong>
      </p>
      <ol>
        <li>Click <strong>⏺ Record</strong> in the top-right corner</li>
        <li>The request will be made and cached</li>
        <li>Click <strong>🔄 Mock</strong> to serve from cache</li>
        <li>Reload the page - instant response!</li>
      </ol>
    </div>

    <div class="demo">
      <button @click="fetchPokemon" :disabled="loading">
        {{ loading ? 'Loading...' : 'Fetch Pokemon' }}
      </button>

      <div v-if="error" class="error">❌ Error: {{ error }}</div>

      <div v-if="pokemon" class="pokemon">
        <img :src="pokemon.sprites.front_default" :alt="pokemon.name" />
        <h2>{{ pokemon.name }}</h2>
        <div class="types">
          <span v-for="type in pokemon.types" :key="type.type.name" class="type">
            {{ type.type.name }}
          </span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        Open DevTools Console to see cache logs:
        <code>✅ Cached: ...</code> or <code>🔄 Serving from cache: ...</code>
      </p>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #42b883;
}

.instructions {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.instructions ol {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
}

.demo {
  text-align: center;
}

button {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #35a372;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  margin-top: 1rem;
  padding: 1rem;
  background: #ffebee;
  border-radius: 4px;
}

.pokemon {
  margin-top: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pokemon img {
  width: 150px;
  height: 150px;
}

.pokemon h2 {
  margin: 0.5rem 0;
  text-transform: capitalize;
}

.types {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.type {
  background: #eeeeee;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  text-transform: capitalize;
}

.footer {
  margin-top: 2rem;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}

.footer code {
  background: #f5f5f5;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
}
</style>
