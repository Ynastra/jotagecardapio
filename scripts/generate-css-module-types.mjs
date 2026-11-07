import { readdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preprocessCSS, resolveConfig } from 'vite'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const sourceRoots = [join(root, 'src')]
const header = '// Tipos das classes do módulo CSS correspondente.\n'
const suffix = '.module.d.css.ts'

async function collectFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

function declaration(classNames) {
  const properties = classNames.map((name) => `  readonly ${JSON.stringify(name)}: string;`).join('\n')
  return `${header}declare const classes: {\n${properties}${properties ? '\n' : ''}};\nexport default classes;\n`
}

async function main() {
  const config = await resolveConfig({}, 'build', 'production')
  const files = (await Promise.all(sourceRoots.map(collectFiles))).flat().sort()
  const sources = files.filter((file) => file.endsWith('.module.css'))
  const expected = new Map()

  for (const source of sources) {
    const result = await preprocessCSS(await readFile(source, 'utf8'), source, config)
    if (!result.modules) throw new Error(`Vite não retornou classes para ${source}`)
    const names = Object.keys(result.modules).sort()
    const invalid = names.find((name) => !/^[a-z][a-zA-Z0-9]*$/.test(name))
    if (invalid) throw new Error(`Classe CSS Module fora da convenção camelCase em ${source}: ${invalid}`)
    expected.set(source.replace(/\.css$/, '.d.css.ts'), declaration(names))
  }

  for (const file of files.filter((path) => path.endsWith(suffix))) {
    const content = await readFile(file, 'utf8')
    if (!content.startsWith(header)) {
      if (expected.has(file)) throw new Error(`Declaração manual não será sobrescrita: ${file}`)
      continue
    }
  }

  for (const [file, content] of expected) {
    await writeFile(file, content)
  }
  for (const file of files.filter((path) => path.endsWith(suffix) && !expected.has(path))) {
    if ((await readFile(file, 'utf8')).startsWith(header)) await unlink(file)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
