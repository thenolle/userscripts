const isTextInput = (element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement

const emptyText = (text: string): boolean => text.replace(/\u200b/g, '') === ''

export const caretAtStart = (editable: HTMLElement): boolean => {
  if (isTextInput(editable)) return editable.selectionStart === 0 && editable.selectionEnd === 0
  const selection = window.getSelection()
  if (!selection?.rangeCount || !selection.isCollapsed || !selection.anchorNode || !editable.contains(selection.anchorNode)) return false
  const range = document.createRange()
  range.selectNodeContents(editable)
  range.setEnd(selection.anchorNode, selection.anchorOffset)
  return emptyText(range.toString())
}

export const caretAtEnd = (editable: HTMLElement): boolean => {
  if (isTextInput(editable)) return editable.selectionStart === editable.value.length && editable.selectionEnd === editable.value.length
  const selection = window.getSelection()
  if (!selection?.rangeCount || !selection.isCollapsed || !selection.anchorNode || !editable.contains(selection.anchorNode)) return false
  const range = document.createRange()
  range.selectNodeContents(editable)
  range.setStart(selection.anchorNode, selection.anchorOffset)
  return emptyText(range.toString())
}
