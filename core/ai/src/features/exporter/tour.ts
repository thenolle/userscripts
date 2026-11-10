import type { Tour } from '../tutorial/source'
import { info } from '../tutorial/steps'

export const createPdfTour = (): Tour => ({
  id: 'pdf-reports',
  title: 'PDF reports',
  summary: 'Create a readable report with contents, sections and selectable text.',
  steps: [
    info(
      'Open the conversation exporter',
      'Open a conversation, choose its export action, then select PDF report. Only content available to the platform export source is included.'
    ),
    info(
      'Preview the report',
      'Open PDF preview creates a new tab with the title, source URL, export time, contents links and styled body. Review tables and code before saving.'
    ),
    info(
      'Save through your browser',
      'Choose Print / Save as PDF in the preview. Select Save as PDF, enable background graphics for colors, and enable browser headers and footers if you want page numbers.'
    ),
    info(
      'Keep a machine-readable companion',
      'Export Markdown or JSON as well when another AI will read the conversation. PDF text remains selectable, but extraction order and font coverage vary by browser.'
    )
  ]
})
