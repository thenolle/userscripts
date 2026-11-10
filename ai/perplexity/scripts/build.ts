import { buildUserscript } from '@nolly/core/build'
import pkg from '../package.json' with { type: 'json' }
import { SLUG } from '../src/repo'
import { createHeader } from './header'

await buildUserscript({ slug: SLUG, version: pkg.version, header: createHeader({ version: pkg.version }) })
