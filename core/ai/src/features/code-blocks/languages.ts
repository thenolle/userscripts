type Entry = readonly [id: string, name: string, hue: number, ext: string, aliases: string]

const TABLE: readonly Entry[] = [
	['tsx', 'TSX', 211, 'tsx', 'tsx typescriptreact'],
	['jsx', 'JSX', 190, 'jsx', 'jsx javascriptreact'],
	['vue', 'Vue', 153, 'vue', 'vue'],
	['svelte', 'Svelte', 15, 'svelte', 'svelte'],
	['scss', 'SCSS', 330, 'scss', 'scss sass'],
	['fsharp', 'F#', 200, 'fs', 'fsharp f# fs fsx'],
	['erlang', 'Erlang', 340, 'erl', 'erlang erl'],
	['ocaml', 'OCaml', 25, 'ml', 'ocaml ml mli'],
	['nix', 'Nix', 210, 'nix', 'nix'],
	['terraform', 'Terraform', 260, 'tf', 'terraform tf hcl'],
	['hcl', 'HCL', 260, 'hcl', 'hcl'],
	['prisma', 'Prisma', 220, 'prisma', 'prisma'],
	['astro', 'Astro', 280, 'astro', 'astro'],
	['fish', 'Fish', 100, 'fish', 'fish'],
	['hlsl', 'HLSL', 175, 'hlsl', 'hlsl fx'],
	['glsl', 'GLSL', 175, 'glsl', 'glsl vert frag'],
	['wgsl', 'WGSL', 175, 'wgsl', 'wgsl'],
	['jupyter', 'Jupyter', 25, 'ipynb', 'jupyter ipynb'],
	['mermaid', 'Mermaid', 330, 'mmd', 'mermaid mmd'],
	['plantuml', 'PlantUML', 40, 'puml', 'plantuml puml'],
	['cobol', 'COBOL', 205, 'cob', 'cobol cob cbl'],
	['fortran', 'Fortran', 280, 'f90', 'fortran f90 f95 f03'],
	['javascript', 'JavaScript', 50, 'js', 'js mjs cjs node nodejs'],
	['typescript', 'TypeScript', 211, 'ts', 'ts'],
	['python', 'Python', 207, 'py', 'py python3 py3 ipython'],
	['bash', 'Shell', 140, 'sh', 'sh shell zsh bash console terminal shellscript'],
	['powershell', 'PowerShell', 215, 'ps1', 'ps1 pwsh'],
	['json', 'JSON', 90, 'json', 'json jsonc json5'],
	['yaml', 'YAML', 0, 'yml', 'yml yaml'],
	['toml', 'TOML', 25, 'toml', 'toml ini cfg'],
	['html', 'HTML', 15, 'html', 'html htm xhtml svg'],
	['xml', 'XML', 165, 'xml', 'xml xsl plist'],
	['css', 'CSS', 265, 'css', 'css less'],
	['sql', 'SQL', 200, 'sql', 'sql mysql postgres postgresql sqlite plsql tsql'],
	['go', 'Go', 190, 'go', 'go golang'],
	['rust', 'Rust', 20, 'rs', 'rs rust'],
	['java', 'Java', 10, 'java', 'java'],
	['kotlin', 'Kotlin', 280, 'kt', 'kt kotlin kts'],
	['swift', 'Swift', 15, 'swift', 'swift'],
	['c', 'C', 220, 'c', 'c h'],
	['cpp', 'C++', 215, 'cpp', 'cpp c++ cc cxx hpp'],
	['csharp', 'C#', 280, 'cs', 'cs csharp c#'],
	['php', 'PHP', 240, 'php', 'php'],
	['ruby', 'Ruby', 0, 'rb', 'rb ruby'],
	['markdown', 'Markdown', 200, 'md', 'md markdown mdx'],
	['diff', 'Diff', 130, 'diff', 'diff patch'],
	['dockerfile', 'Dockerfile', 205, 'Dockerfile', 'dockerfile docker'],
	['text', 'Text', 0, 'txt', 'text txt plain plaintext none'],
	['lua', 'Lua', 240, 'lua', 'lua'],
	['r', 'R', 210, 'r', 'r rscript'],
	['dart', 'Dart', 200, 'dart', 'dart'],
	['scala', 'Scala', 5, 'scala', 'scala sc'],
	['perl', 'Perl', 230, 'pl', 'pl perl'],
	['haskell', 'Haskell', 270, 'hs', 'hs haskell'],
	['elixir', 'Elixir', 280, 'ex', 'ex exs elixir'],
	['clojure', 'Clojure', 220, 'clj', 'clj cljs clojure'],
	['matlab', 'MATLAB', 15, 'm', 'matlab octave'],
	['vim', 'Vim script', 140, 'vim', 'vim vimscript'],
	['nginx', 'Nginx', 145, 'conf', 'nginx'],
	['graphql', 'GraphQL', 320, 'graphql', 'graphql gql'],
	['protobuf', 'Protobuf', 210, 'proto', 'proto protobuf'],
	['makefile', 'Makefile', 200, 'mk', 'make makefile mk'],
	['latex', 'LaTeX', 180, 'tex', 'tex latex'],
	['groovy', 'Groovy', 200, 'groovy', 'groovy gradle'],
	['solidity', 'Solidity', 0, 'sol', 'sol solidity'],
	['zig', 'Zig', 35, 'zig', 'zig'],
	['nim', 'Nim', 55, 'nim', 'nim'],
	['julia', 'Julia', 285, 'jl', 'jl julia'],
	['assembly', 'Assembly', 40, 'asm', 'asm assembly nasm'],
	['objectivec', 'Objective-C', 215, 'm', 'objc objectivec objective-c'],
	['regex', 'Regex', 260, 'txt', 'regex regexp'],
	['http', 'HTTP', 215, 'http', 'http'],
	['log', 'Log', 0, 'log', 'log logs'],
	['csv', 'CSV', 150, 'csv', 'csv tsv'],
	['batch', 'Batch', 0, 'bat', 'bat batch cmd'],
]

export interface Language {
	readonly id: string
	readonly name: string
	readonly hue: number
	readonly ext: string
}

const BY_ID = new Map<string, Language>()
const BY_ALIAS = new Map<string, string>()

for (const [id, name, hue, ext, aliases] of TABLE) {
	BY_ID.set(id, { id, name, hue, ext })
	BY_ALIAS.set(id, id)
	for (const alias of aliases.split(' ')) BY_ALIAS.set(alias, id)
}

export const normalizeLanguage = (raw: string): string => {
	const key = raw.trim().toLowerCase().replace(/^\./, '')
	return BY_ALIAS.get(key) ?? key
}

export const isKnownLanguage = (id: string): boolean => BY_ID.has(id) && id !== 'text'

export const languageInfo = (id: string): Language => BY_ID.get(id) ?? { id, name: id.charAt(0).toUpperCase() + id.slice(1), hue: 0, ext: 'txt' }

export const languageForFilename = (filename: string): string | null => {
	const basename = filename.split(/[\\/]/).pop()?.toLowerCase() ?? ''
	if (basename === 'dockerfile' || basename.startsWith('dockerfile.')) return 'dockerfile'
	if (basename === 'makefile' || basename === 'gnumakefile') return 'makefile'
	if (basename === 'cmakelists.txt') return 'text'
	if (basename === '.bashrc' || basename === '.zshrc' || basename === '.profile') return 'bash'
	if (basename === '.gitignore' || basename === '.env' || basename.startsWith('.env.')) return 'text'
	const extension = basename.split('.').pop()
	const id = extension ? BY_ALIAS.get(extension) : undefined
	return id && id !== 'text' ? id : null
}
