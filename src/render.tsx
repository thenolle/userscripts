/** @jsxImportSource @gambrel/view */
import { Alert, AlertDescription, AlertTitle, Badge, CopyButton, H1, H2, H3, H4, InlineCode, P, Separator } from '@gambrel/components'
import { CircleAlert, Info, Lightbulb, OctagonAlert, TriangleAlert } from '@gambrel/icons'
import type { Child } from '@gambrel/view'
import { tokenize } from './highlight.ts'
import { parseBlocks, type AlertKind, type Block, type Inline } from './markdown.ts'
import type { Manifest } from './types.ts'

export interface RenderContext {
  manifest: Manifest
  slug: string
  key: string
}

const ALERTS: Readonly<Record<AlertKind, { title: string; icon: (size: number) => Child; destructive: boolean }>> = {
  note: { title: 'Note', icon: (size) => <Info size={size} />, destructive: false },
  tip: { title: 'Tip', icon: (size) => <Lightbulb size={size} />, destructive: false },
  important: { title: 'Important', icon: (size) => <CircleAlert size={size} />, destructive: false },
  warning: { title: 'Warning', icon: (size) => <TriangleAlert size={size} />, destructive: true },
  caution: { title: 'Caution', icon: (size) => <OctagonAlert size={size} />, destructive: true }
}

export const resolveHref = (href: string, { manifest, slug, key }: RenderContext): { href: string; external: boolean } => {
  if (/^(https?:|mailto:)/i.test(href)) return { href, external: true }
  if (href.startsWith('#')) return { href, external: false }
  const from = key === 'index' || key === 'changelog' ? `/${slug}/` : `/${slug}/docs/`
  const url = new URL(href, `https://local${from}`)
  const parts = url.pathname.split('/').filter(Boolean)
  const script = manifest.scripts.find((candidate) => candidate.slug === parts[0])
  const file = parts.slice(1).join('/')
  const route = (path: string): string => `${manifest.site.base}${path}${url.hash}`
  if (script) {
    if (/^README\.md$/i.test(file)) return { href: route(`${slug}/`), external: false }
    if (/^CHANGELOG\.md$/i.test(file)) return { href: route(`${slug}/changelog/`), external: false }
    const guide = /^docs\/([^/]+)\.md$/.exec(file)?.[1]
    if (guide && script.pages.some((page) => page.key === guide)) return { href: route(`${slug}/${guide}/`), external: false }
  }
  return { href: `https://github.com/${manifest.site.repo}/blob/${manifest.site.branch}${url.pathname}${url.hash}`, external: true }
}

const renderInlines = (inlines: readonly Inline[], context: RenderContext): Child[] =>
  inlines.map((inline): Child => {
    if (inline.image) {
      const src = /^https?:/i.test(inline.image) ? inline.image : `https://raw.githubusercontent.com/${context.manifest.site.repo}/${context.manifest.site.branch}/${context.slug}/${inline.image.replace(/^\.\//, '')}`
      return <img src={src} alt={inline.text} loading="lazy" class="doc-img" />
    }
    let node: Child = inline.code ? <InlineCode>{inline.text}</InlineCode> : inline.text
    if (inline.bold) node = <strong>{node}</strong>
    if (inline.italic) node = <em>{node}</em>
    if (inline.link) {
      const target = resolveHref(inline.link, context)
      node = target.external ? <a href={target.href} target="_blank" rel="noopener noreferrer">{node}</a> : <a href={target.href}>{node}</a>
    }
    return node
  })

const CodeCard = (props: { language: string; title: string | null; code: string }): Child => (
  <figure class="code-card">
    <figcaption class="code-head">
      <span class="code-title">{props.title ?? props.language ?? 'text'}</span>
      {props.title && props.language ? <Badge variant="outline">{props.language}</Badge> : null}
      <CopyButton text={props.code} />
    </figcaption>
    <pre class="code-body">
      <code>{tokenize(props.code, props.language).map((token) => (token.type === 'plain' ? token.text : <span class={`tok tok-${token.type}`}>{token.text}</span>))}</code>
    </pre>
  </figure>
)

const Heading = (props: { block: Extract<Block, { type: 'heading' }>; context: RenderContext }): Child => {
  const { block, context } = props
  const Tag = block.level === 1 ? H1 : block.level === 2 ? H2 : block.level === 3 ? H3 : H4
  return (
    <Tag id={block.id} class="doc-heading">
      {renderInlines(block.inlines, context)}
      <a class="anchor" href={`#${block.id}`} aria-label={`Link to ${block.text}`}>#</a>
    </Tag>
  )
}

export const renderBlocks = (blocks: readonly Block[], context: RenderContext): Child[] => {
  const out: Child[] = []
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index]!
    if (block.type === 'item') {
      const run: Extract<Block, { type: 'item' }>[] = []
      while (blocks[index]?.type === 'item') run.push(blocks[index++] as Extract<Block, { type: 'item' }>)
      index--
      const ordered = run[0]!.ordered
      const items = run.map((item) => (
        <li style={`margin-left:${item.depth * 1.25}rem`} class={item.checked === null ? undefined : 'task'}>
          {item.checked === null ? null : <input type="checkbox" checked={item.checked} disabled aria-label={item.checked ? 'Done' : 'To do'} />}
          {renderInlines(item.inlines, context)}
        </li>
      ))
      out.push(ordered ? <ol class="doc-list" start={run[0]!.number}>{items}</ol> : <ul class="doc-list">{items}</ul>)
      continue
    }
    switch (block.type) {
      case 'heading':
        out.push(<Heading block={block} context={context} />)
        break
      case 'paragraph':
        out.push(<P>{renderInlines(block.inlines, context)}</P>)
        break
      case 'code':
        out.push(<CodeCard language={block.language} title={block.title} code={block.text} />)
        break
      case 'quote': {
        const alert = block.alert ? ALERTS[block.alert] : null
        const next = blocks[index + 1]
        const body = block.alert && block.inlines.length === 0 && next?.type === 'paragraph' ? ((index++, next.inlines)) : block.inlines
        out.push(
          alert ? (
            <Alert variant={alert.destructive ? 'destructive' : 'default'} class="doc-alert">
              {alert.icon(16)}
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{renderInlines(body, context)}</AlertDescription>
            </Alert>
          ) : (
            <blockquote class="doc-quote">{renderInlines(block.inlines, context)}</blockquote>
          )
        )
        break
      }
      case 'rule':
        out.push(<Separator />)
        break
      case 'table':
        out.push(
          <div class="table-wrap">
            <table class="doc-table">
              <thead><tr>{block.header.map((cell) => <th>{renderInlines(cell, context)}</th>)}</tr></thead>
              <tbody>{block.rows.map((row) => <tr>{row.map((cell) => <td>{renderInlines(cell, context)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )
        break
    }
  }
  return out
}

export const renderMarkdown = (markdown: string, context: RenderContext, skipTitle = true): Child[] => {
  const blocks = parseBlocks(markdown)
  const first = blocks[0]
  return renderBlocks(skipTitle && first?.type === 'heading' && first.level === 1 ? blocks.slice(1) : blocks, context)
}