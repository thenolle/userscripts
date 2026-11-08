type Shape = readonly [tag: string, attributes: Readonly<Record<string, string>>]

const ICONS = {
  copy: [['rect', { x: '9', y: '9', width: '13', height: '13', rx: '2' }], ['path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }]],
  check: [['polyline', { points: '20 6 9 17 4 12' }]],
  download: [['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }], ['polyline', { points: '7 10 12 15 17 10' }], ['line', { x1: '12', y1: '15', x2: '12', y2: '3' }]],
  wrap: [['line', { x1: '3', y1: '6', x2: '21', y2: '6' }], ['path', { d: 'M3 12h15a3 3 0 1 1 0 6h-4' }], ['polyline', { points: '16 16 14 18 16 20' }], ['line', { x1: '3', y1: '18', x2: '10', y2: '18' }]],
  lines: [['line', { x1: '10', y1: '6', x2: '21', y2: '6' }], ['line', { x1: '10', y1: '12', x2: '21', y2: '12' }], ['line', { x1: '10', y1: '18', x2: '21', y2: '18' }], ['path', { d: 'M4 6h1v4' }], ['path', { d: 'M4 10h2' }], ['path', { d: 'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1' }]],
  fold: [['polyline', { points: '7 20 12 15 17 20' }], ['polyline', { points: '7 4 12 9 17 4' }]],
  file: [['path', { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }], ['polyline', { points: '14 2 14 8 20 8' }], ['line', { x1: '16', y1: '13', x2: '8', y2: '13' }], ['line', { x1: '16', y1: '17', x2: '8', y2: '17' }]],
  sliders: [['line', { x1: '21', y1: '4', x2: '14', y2: '4' }], ['line', { x1: '10', y1: '4', x2: '3', y2: '4' }], ['line', { x1: '21', y1: '12', x2: '12', y2: '12' }], ['line', { x1: '8', y1: '12', x2: '3', y2: '12' }], ['line', { x1: '21', y1: '20', x2: '16', y2: '20' }], ['line', { x1: '12', y1: '20', x2: '3', y2: '20' }], ['line', { x1: '14', y1: '2', x2: '14', y2: '6' }], ['line', { x1: '8', y1: '10', x2: '8', y2: '14' }], ['line', { x1: '16', y1: '18', x2: '16', y2: '22' }]],
  book: [['path', { d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20' }]],
  layers: [['polygon', { points: '12 2 2 7 12 12 22 7 12 2' }], ['polyline', { points: '2 17 12 22 22 17' }], ['polyline', { points: '2 12 12 17 22 12' }]],
  help: [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }], ['line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }]],
} as const satisfies Record<string, readonly Shape[]>

export type IconName = keyof typeof ICONS

const NS = 'http://www.w3.org/2000/svg'

export const createIcon = (name: IconName, size = 16): SVGSVGElement => {
  const svg = document.createElementNS(NS, 'svg')
  const attributes = { width: String(size), height: String(size), viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }
  for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, value)
  for (const [tag, props] of ICONS[name] as readonly Shape[]) {
    const element = document.createElementNS(NS, tag)
    for (const [key, value] of Object.entries(props)) element.setAttribute(key, value)
    svg.appendChild(element)
  }
  return svg
}