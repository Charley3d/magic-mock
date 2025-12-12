import React, { useState } from 'react'
import './App.css'

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

const App: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pokemonCount, setPokemonCount] = useState(5)
  const [stats, setStats] = useState<Stats>({ count: 0, totalTime: 0, avgTime: 0 })
  const [showResult, setShowResult] = useState(false)

  const fetchPokemon = async () => {
    setLoading(true)
    setError(null)
    setShowResult(false)
    setPokemonList([])

    const startTime = performance.now()
    const count = pokemonCount
    const selectedPokemon = POKEMON_NAMES.slice(0, count)

    try {
      // Fetch Pokemon sequentially (one at a time) to demonstrate dramatic performance difference
      // Recording mode: ~200ms per Pokemon × 50 = ~10 seconds
      // Mocking mode: ~2ms per Pokemon × 50 = ~100ms
      const results: Pokemon[] = []
      for (const name of selectedPokemon) {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
        if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status} ${res.statusText}`)
        const pokemon = await res.json()
        results.push(pokemon)

        setPokemonList([...results])
      }

      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)

      setPokemonList(results)
      setStats({
        count: results.length,
        totalTime,
        avgTime: Math.round(totalTime / results.length),
      })
      setShowResult(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setShowResult(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>Magic Mock - Pokemon Explorer</h1>
      <p>Select how many Pokemon to fetch and see the magic-mock performance difference!</p>

      <div className="controls">
        <label htmlFor="pokemonCount">Number of Pokemon:</label>
        <select
          id="pokemonCount"
          value={pokemonCount}
          onChange={(e) => setPokemonCount(Number(e.target.value))}
          disabled={loading}
        >
          <option value={1}>1</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <button onClick={fetchPokemon} disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Pokemon'}
        </button>
      </div>

      {showResult && (
        <div className="result">
          <div className="stats">
            <span>Pokemon Loaded: {stats.count}</span>
            <span>
              Total Time: {stats.totalTime}ms ({stats.avgTime}ms avg per Pokemon)
            </span>
          </div>

          {error ? (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <div className="pokemon-grid">
              {pokemonList.map((pokemon) => (
                <div key={pokemon.id} className="pokemon-card">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <div className="pokemon-name">{pokemon.name}</div>
                  <div className="pokemon-types">
                    {pokemon.types.map((type) => (
                      <span
                        key={type.type.name}
                        className="type-badge"
                        style={{ backgroundColor: getTypeColor(type.type.name) }}
                      >
                        {type.type.name}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    Height: {pokemon.height} | Weight: {pokemon.weight}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
