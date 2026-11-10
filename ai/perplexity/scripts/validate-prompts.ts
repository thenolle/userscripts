import library from '../prompts/library.json' with { type: 'json' }

const problems: string[] = []
const seen = new Set<string>()

if (library.version !== 1) problems.push('version must be 1')
if (!Array.isArray(library.prompts) || !library.prompts.length) problems.push('prompts must be a non-empty array')

for (const [index, prompt] of (library.prompts ?? []).entries()) {
  const label = `prompts[${index}]`
  const { id, title, body } = prompt as { id?: unknown; title?: unknown; body?: unknown }
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(id)) problems.push(`${label}.id must be a lowercase slug`)
  else if (seen.has(id)) problems.push(`${label}.id "${id}" is duplicated`)
  else seen.add(id)
  if (typeof title !== 'string' || !title.trim() || title.length > 80) problems.push(`${label}.title must be 1-80 characters`)
  if (typeof body !== 'string' || !body.trim() || body.length > 4000) problems.push(`${label}.body must be 1-4000 characters`)
}

if (problems.length) {
  console.error(`prompts/library.json is invalid:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(`prompts/library.json OK (${seen.size} prompts)`)