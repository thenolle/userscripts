/** @jsxImportSource @gambrel/view */
import { Badge, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, buttonVariants, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Command, CopyButton, DataTable, Dialog, DropdownMenu, Kbd, Sheet, Toaster, VisuallyHidden, type DataColumn } from '@gambrel/components'
import { ArrowRight, BookOpen, ChevronDown, Download, ExternalLink, GitBranch, Heart, Menu, Moon, Search, Shield, Sun, Zap } from '@gambrel/icons'
import type { Child } from '@gambrel/view'
import { renderMarkdown } from './render.tsx'
import { findPage, findScript, type Store } from './store.ts'
import type { PageMeta, Prompt, ScriptMeta } from './types.ts'

const href = (store: Store, path: string): string => `${store.manifest.site.base}${path}`

const Link = (props: { store: Store; path: string; class?: string; current?: () => boolean; children?: Child }): Child => (
  <a class={props.class} href={href(props.store, props.path)} aria-current={props.current ? () => (props.current?.() ? 'page' : undefined) : undefined}>
    {props.children}
  </a>
)

const searchItems = (store: Store) => store.manifest.scripts.flatMap((script) => script.pages.flatMap((page) => [{
  value: page.path,
  label: page.title,
  group: script.name,
  keywords: [page.description, page.section, ...page.headings.map((heading) => heading.text)],
  onSelect: () => store.go(page.path)
}, ...page.headings.filter((heading) => heading.depth >= 2 && heading.depth <= 3).map((heading) => ({ value: `${page.path}#${heading.id}`, label: heading.text, group: `${script.name} · ${page.title}`, keywords: [page.title], onSelect: () => store.go(`${page.path}#${heading.id}`) }))]))

const Header = (props: { store: Store }): Child => {
  const { store } = props
  const first = store.manifest.scripts[0]
  const guide = first?.pages.find((page) => page.kind === 'guide')
  return (
    <header class="site-header">
      <div class="header-inner">
        <Button variant="ghost" size="icon" class="only-mobile" aria-label="Open navigation" onClick={() => store.navOpen.set(true)}>
          <Menu size={18} />
        </Button>
        <Link store={store} path="" class="brand">
          <span class="brand-mark" aria-hidden="true">U</span>
          <span class="brand-name">Userscripts</span>
        </Link>
        <nav class="header-nav" aria-label="Primary">
          <DropdownMenu
            id="scripts-menu"
            trigger={(triggerProps) => (
              <Button variant="ghost" size="sm" {...triggerProps}>
                Scripts <ChevronDown size={14} />
              </Button>
            )}
            items={store.manifest.scripts.map((script) => ({ label: script.name, onSelect: () => store.go(`${script.slug}/`) }))}
          />
          {guide ? <Link store={store} path={guide.path} class={buttonVariants({ variant: 'ghost', size: 'sm' })}>Guides</Link> : null}
        </nav>
        <div class="header-actions">
          <Button variant="outline" size="sm" class="search-button" onClick={() => store.searchOpen.set(true)}>
            <Search size={14} />
            <span class="only-desktop">Search docs…</span>
            <Kbd>Ctrl K</Kbd>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => store.toggleTheme()}>
            {() => (store.theme() === 'dark' ? <Sun size={16} /> : <Moon size={16} />)}
          </Button>
          <a class={buttonVariants({ variant: 'ghost', size: 'icon' })} href={`https://github.com/${store.manifest.site.repo}`} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
            <GitBranch size={16} />
          </a>
        </div>
      </div>
    </header>
  )
}

const sections = (script: ScriptMeta): [string, PageMeta[]][] => {
  const groups = new Map<string, PageMeta[]>()
  for (const page of script.pages) groups.set(page.section, [...(groups.get(page.section) ?? []), page])
  return [...groups]
}

const SidebarNav = (props: { store: Store; slug: string | null; pageKey: string | null }): Child => {
  const { store, slug, pageKey } = props
  return (
    <nav class="sidebar-nav" aria-label="Documentation">
      {store.manifest.scripts.map((script) => (
        <section class="nav-script">
          <Link store={store} path={`${script.slug}/`} class="nav-script-title" current={() => script.slug === slug && pageKey === 'index'}>
            {script.name}
            <Badge variant="secondary">v{script.version}</Badge>
          </Link>
          {script.slug === slug ? sections(script).map(([title, pages]) => (
            <div class="nav-group">
              <h2>{title}</h2>
              <ul>
                {pages.filter((page) => page.kind !== 'overview').map((page) => (
                  <li><Link store={store} path={page.path} class="nav-link" current={() => page.key === pageKey}>{page.title}</Link></li>
                ))}
              </ul>
            </div>
          )) : null}
        </section>
      ))}
    </nav>
  )
}

const Toc = (props: { page: PageMeta }): Child => {
  const items = props.page.headings.filter((heading) => heading.depth >= 2 && heading.depth <= 3)
  return items.length < 2 ? null : (
    <aside class="toc" aria-label="On this page">
      <h2>On this page</h2>
      <ul>{items.map((heading) => <li class={`depth-${heading.depth}`}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ul>
    </aside>
  )
}

const Pager = (props: { store: Store; script: ScriptMeta; page: PageMeta }): Child => {
  const pages = props.script.pages
  const index = pages.indexOf(props.page)
  const previous = pages[index - 1]
  const next = pages[index + 1]
  return (
    <nav class="pager" aria-label="Pagination">
      {previous ? <Link store={props.store} path={previous.path} class="pager-card"><small>Previous</small>{previous.title}</Link> : <span />}
      {next ? <Link store={props.store} path={next.path} class="pager-card next"><small>Next</small>{next.title}</Link> : null}
    </nav>
  )
}

const promptColumns: readonly DataColumn<Prompt>[] = [
  { id: 'title', header: 'Prompt', text: (row) => row.title, compare: (a, b) => a.title.localeCompare(b.title) },
  { id: 'body', header: 'Text', text: (row) => row.body, cell: (row) => <span class="prompt-body">{row.body}</span> },
  { id: 'copy', header: '', text: () => '', cell: (row) => <CopyButton text={row.body} /> }
]

const DocPage = (props: { store: Store; script: ScriptMeta; page: PageMeta }): Child => {
  const { store, script, page } = props
  const loaded = store.page()
  const context = { manifest: store.manifest, slug: script.slug, key: page.key }
  return (
    <div class="doc-layout">
      <article class="doc">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href={href(store, '')}>Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href={href(store, `${script.slug}/`)}>{script.name}</BreadcrumbLink></BreadcrumbItem>
            {page.kind === 'overview' ? null : <BreadcrumbSeparator />}
            {page.kind === 'overview' ? null : <BreadcrumbItem><BreadcrumbPage>{page.title}</BreadcrumbPage></BreadcrumbItem>}
          </BreadcrumbList>
        </Breadcrumb>
        <header class="doc-header">
          <h1>{page.kind === 'overview' ? script.name : page.title}</h1>
          <p class="lead">{page.description}</p>
          <div class="doc-meta">
            <Badge variant="secondary">v{script.version}</Badge>
            {script.kind === 'library' ? <Badge variant="outline">Library</Badge> : null}
            <Badge variant="outline">{script.license}</Badge>
            <span>{page.minutes} min read</span>
          </div>
          {page.kind === 'overview' ? (
            <div class="install-row">
              {script.kind === 'script' ? <a class={buttonVariants({ variant: 'default' })} href={script.installUrl}><Download size={16} /> Install</a> : null}
              {script.kind === 'script' ? <CopyButton text={script.installUrl} /> : null}
              <a class={buttonVariants({ variant: 'outline' })} href={script.folderUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Source</a>
            </div>
          ) : null}
        </header>
        {loaded === null ? <p>Loading…</p> : renderMarkdown(loaded.markdown, context, page.kind !== 'prompts')}
        {loaded?.prompts ? <DataTable caption="Community prompts" rows={loaded.prompts} columns={promptColumns} pageSize={10} /> : null}
        <a class="edit-link" href={`https://github.com/${store.manifest.site.repo}/blob/${store.manifest.site.branch}/${page.source}`} target="_blank" rel="noopener noreferrer">Edit this page on GitHub <ArrowRight size={14} /></a>
        <Pager store={store} script={script} page={page} />
      </article>
      <Toc page={page} />
    </div>
  )
}

const Home = (props: { store: Store }): Child => {
  const { store } = props
  return (
    <div class="home">
      <section class="hero">
        <Badge variant="secondary">Open documentation</Badge>
        <h1>Userscripts that stay out of your way.</h1>
        <p class="lead">Small, focused browser scripts by Nolly, each with guides, release notes and automatic updates.</p>
        <div class="hero-actions">
          {store.manifest.scripts[0] ? <Link store={store} path={`${store.manifest.scripts[0].slug}/`} class={buttonVariants({ size: 'lg' })}>Browse the docs <ArrowRight size={16} /></Link> : null}
          <a class={buttonVariants({ variant: 'outline', size: 'lg' })} href={`https://github.com/${store.manifest.site.repo}`} target="_blank" rel="noopener noreferrer">View on GitHub</a>
        </div>
      </section>
      <section class="card-grid" aria-label="Userscripts">
        {store.manifest.scripts.map((script) => (
          <Card>
            <CardHeader>
              <CardTitle>{script.name} <Badge variant="secondary">v{script.version}</Badge></CardTitle>
              <CardDescription>{script.description}</CardDescription>
            </CardHeader>
            <CardContent><span class="muted">{script.pages.length} pages · {script.license}</span></CardContent>
            <CardFooter>
              <Link store={store} path={`${script.slug}/`} class={buttonVariants({ variant: 'default', size: 'sm' })}>Read the docs</Link>
              {script.kind === 'script' ? <a class={buttonVariants({ variant: 'outline', size: 'sm' })} href={script.installUrl}>Install</a> : null}
            </CardFooter>
          </Card>
        ))}
      </section>
      <section class="features">
        <div><Zap size={20} /><h2>Automatic updates</h2><p>Every release is published to a dedicated branch your userscript manager follows.</p></div>
        <div><Shield size={20} /><h2>Private by design</h2><p>No analytics and no servers. Settings stay in your userscript manager.</p></div>
        <div><BookOpen size={20} /><h2>Real documentation</h2><p>Guides, shortcuts, troubleshooting and a changelog for every script.</p></div>
      </section>
    </div>
  )
}

const NotFound = (props: { store: Store }): Child => (
  <div class="not-found">
    <h1>Page not found</h1>
    <p class="lead">That page does not exist, or it moved.</p>
    <Link store={props.store} path="" class={buttonVariants({ variant: 'default' })}>Back to the documentation</Link>
  </div>
)

const renderRoute = (store: Store): Child => {
  const route = store.route()
  if (route.kind === 'home') return <Home store={store} />
  if (route.kind === 'missing') return <NotFound store={store} />
  const script = findScript(store.manifest, route.slug)
  const page = findPage(script, route.key)
  return script && page ? <DocPage store={store} script={script} page={page} /> : <NotFound store={store} />
}

const renderSidebar = (store: Store): Child => {
  const route = store.route()
  return <SidebarNav store={store} slug={route.kind === 'page' ? route.slug : null} pageKey={route.kind === 'page' ? route.key : null} />
}

export function App(props: { store: Store }): Child {
  const { store } = props
  const { site } = store.manifest
  return (
    <div class="shell">
      <a class="skip" href="#content">Skip to content</a>
      <Header store={store} />
      <div class="body">
        <aside class="sidebar">{() => renderSidebar(store)}</aside>
        <main id="content" class="main">{() => renderRoute(store)}</main>
      </div>
      <footer class="site-footer">
        <span>© {new Date(site.generated).getUTCFullYear()} Nolly · <a href={`https://github.com/${site.repo}/blob/${site.branch}/LICENSE`}>PolyForm Strict 1.0.0</a></span>
        <a href={site.sponsor} target="_blank" rel="noopener noreferrer"><Heart size={14} /> Sponsor</a>
      </footer>
      <Dialog id="search" title="Search documentation" description="Jump to any page or section." open={store.searchOpen} onOpenChange={store.searchOpen.set}>
        <Command id="site-search" items={searchItems(store).map((item) => ({ ...item, onSelect: () => { store.searchOpen.set(false); item.onSelect() } }))} />
      </Dialog>
      <Sheet id="navigation" side="left" title="Navigation" open={store.navOpen} onOpenChange={store.navOpen.set}>
        {() => renderSidebar(store)}
      </Sheet>
      <Toaster position="bottom-right" />
      <VisuallyHidden>{() => (store.loading() ? 'Loading page' : '')}</VisuallyHidden>
    </div>
  )
}