import type { Block, Inline } from './markdown'
import { zip } from './zip'

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const HEADING_SIZES = [40, 32, 28, 26, 24, 22]
const BORDERS = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']

const esc = (text: string): string => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char)

const stylesXml = (): string => {
  const headings = HEADING_SIZES.map((size, index) => `<w:style w:type="paragraph" w:styleId="Heading${index + 1}"><w:name w:val="heading ${index + 1}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="${index}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${size}"/></w:rPr></w:style>`).join('')
  const borders = BORDERS.map((name) => `<w:${name} w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/>`).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${headings}<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F3F3F3"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="19"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="BFBFBF"/></w:pBdr><w:ind w:left="360"/></w:pPr><w:rPr><w:i/><w:color w:val="595959"/></w:rPr></w:style><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders>${borders}</w:tblBorders><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`
}

export const buildDocx = (blocks: readonly Block[]): Uint8Array => {
  const links: string[] = []
  const linkId = (url: string): number => {
    let index = links.indexOf(url)
    if (index < 0) {
      links.push(url)
      index = links.length - 1
    }
    return index + 10
  }
  const run = (inline: Inline, bold = false): string => {
    const props = `${inline.link ? '<w:rStyle w:val="Hyperlink"/>' : ''}${inline.code ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>' : ''}${inline.bold || bold ? '<w:b/>' : ''}${inline.italic ? '<w:i/>' : ''}${inline.code ? '<w:shd w:val="clear" w:color="auto" w:fill="EDEDED"/>' : ''}`
    const element = `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(inline.text)}</w:t></w:r>`
    return inline.link ? `<w:hyperlink r:id="rId${linkId(inline.link)}">${element}</w:hyperlink>` : element
  }
  const runs = (inlines: readonly Inline[], bold = false): string => inlines.map((inline) => run(inline, bold)).join('')
  const para = (content: string, style = '', extra = ''): string => `<w:p>${style || extra ? `<w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}${extra}</w:pPr>` : ''}${content}</w:p>`
  const plainRun = (text: string): string => `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`
  const body = blocks.map((block): string => {
    switch (block.type) {
      case 'heading': return para(runs(block.inlines), `Heading${Math.min(block.level, 6)}`)
      case 'paragraph': return para(runs(block.inlines))
      case 'quote': return para(runs(block.inlines), 'Quote')
      case 'rule': return para('', '', '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr>')
      case 'item': return para(`${plainRun(block.ordered ? `${block.number}.` : '•')}<w:r><w:tab/></w:r>${runs(block.inlines)}`, '', `<w:ind w:left="${360 + block.depth * 360}" w:hanging="360"/>`)
      case 'code': return block.text.split('\n').map((line) => para(plainRun(line.replace(/\t/g, '    ')), 'Code')).join('') + para('')
      case 'table': {
        const columns = Math.max(1, block.header.length)
        const width = Math.floor(9600 / columns)
        const row = (cells: readonly (readonly Inline[])[], header: boolean): string => `<w:tr>${Array.from({ length: columns }, (_, index) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${header ? '<w:shd w:val="clear" w:color="auto" w:fill="F0F0F0"/>' : ''}</w:tcPr>${para(runs(cells[index] ?? [], header))}</w:tc>`).join('')}</w:tr>`
        const grid = Array.from({ length: columns }, () => `<w:gridCol w:w="${width}"/>`).join('')
        return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${row(block.header, true)}${block.rows.map((cells) => row(cells, false)).join('')}</w:tbl>${para('')}`
      }
    }
  }).join('')
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}${para('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`
  const relationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/styles" Target="styles.xml"/>${links.map((url, index) => `<Relationship Id="rId${index + 10}" Type="${R}/hyperlink" Target="${esc(url)}" TargetMode="External"/>`).join('')}</Relationships>`
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`
  const encoder = new TextEncoder()
  return zip([
    { name: '[Content_Types].xml', data: encoder.encode(contentTypes) },
    { name: '_rels/.rels', data: encoder.encode(rootRels) },
    { name: 'word/document.xml', data: encoder.encode(document) },
    { name: 'word/styles.xml', data: encoder.encode(stylesXml()) },
    { name: 'word/_rels/document.xml.rels', data: encoder.encode(relationships) }
  ])
}