import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const red = (text: string) => `\x1b[31m${text}\x1b[0m`
const green = (text: string) => `\x1b[32m${text}\x1b[0m`

function main() {
  const filename = 'client-script'
  const args = process.argv.slice(2)
  const command = args[0]

  if (command !== 'init') {
    console.error(red('Usage: magicmock init [PUBLIC_DIR] [--save]'))
    process.exit(1)
  }

  // publicDir est le premier arg qui ne commence pas par --
  const publicDir = args.slice(1).find((arg) => !arg.startsWith('--')) || './'
  const saveFlag = args.includes('--save')

  // Si publicDir est par défaut (./) et --save est utilisé, erreur
  if (publicDir === './' && saveFlag) {
    console.error(red('Failed: --save cannot be used without specifying a PUBLIC_DIR'))
    console.error(red('Usage: magicmock init <PUBLIC_DIR> --save'))
    process.exit(1)
  }

  const targetDir = resolve(process.cwd(), publicDir)

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
    console.log(green(`✓ Created directory ${publicDir}`))
  }

  const filesToCopy = [`${filename}.js`, `${filename}.js.map`]
  const distDir = resolve(__dirname, 'standalone')

  for (const file of filesToCopy) {
    const src = resolve(distDir, file)
    const dest = resolve(targetDir, file)

    if (existsSync(src)) {
      copyFileSync(src, dest)
      console.log(
        green(`✓ Copied ${file} → ${publicDir}${publicDir.endsWith('/') ? '' : '/'}${file}`),
      )
    } else {
      console.error(red(`⚠ Failed: ${file} not found at ${src}`))
      process.exit(1)
    }
  }

  console.log(green('\n✓ Magic Mock initialized successfully!'))
}

main()
