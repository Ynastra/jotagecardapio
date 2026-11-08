import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

// Durante a edição, um slice novo passa por estados intermediários (ainda sem
// segmento, ainda sem consumidor) que só fazem sentido quando o trabalho acaba.
// O check rápido ignora essas duas regras; o check completo continua com elas.
const isEditTimeCheck = process.env.npm_lifecycle_event === 'check:fsd:fast'

const editTimeOverrides = isEditTimeCheck
    ? [{ rules: { 'fsd/insignificant-slice': 'off', 'fsd/no-segmentless-slices': 'off' } } as const]
    : []

export default defineConfig([...fsd.configs.recommended, ...editTimeOverrides])
