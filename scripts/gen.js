import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const isLocal = process.argv.includes('--local')

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
)

const projectId = env['SUPABASE_PROJECT_ID']
if (!isLocal && !projectId) {
  console.error('Missing SUPABASE_PROJECT_ID in .env')
  process.exit(1)
}

const genFlag = isLocal ? '--local' : `--project-id ${projectId}`

console.log(`Generating Supabase types (${isLocal ? 'local' : 'remote'})...`)
execSync(
  `npx supabase gen types typescript ${genFlag} --schema public > src/types/database.types.ts`,
  { stdio: 'inherit', shell: '/bin/zsh' }
)

console.log('Generating Zod schemas...')
execSync(
  'npx supazod -i src/types/database.types.ts -o src/types/database.schemas.ts',
  { stdio: 'inherit' }
)

console.log('Done.')
