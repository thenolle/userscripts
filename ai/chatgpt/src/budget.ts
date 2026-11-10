import type { ChatSession } from './session'

export const FILES_PER_MESSAGE = 20

export interface FileBudget {
  readonly perMessage: number
  readonly remainingUploads: number | null
  readonly uploadResetsAt: string | null
  readonly remainingPasteToFile: number | null
  readonly pasteResetsAt: string | null
  readonly maxFileMb: number | null
}

export const fileBudget = (session: ChatSession): FileBudget => {
  const upload = session.limit('file_upload')
  const paste = session.limit('paste_text_to_file')
  return {
    perMessage: FILES_PER_MESSAGE,
    remainingUploads: upload?.remaining ?? null,
    uploadResetsAt: upload?.resetAfter ?? null,
    remainingPasteToFile: paste?.remaining ?? null,
    pasteResetsAt: paste?.resetAfter ?? null,
    maxFileMb: session.maxFileMb
  }
}
