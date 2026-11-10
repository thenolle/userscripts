let recent = ''

export const rememberSelection = (text: string): void => {
  if (text.trim()) recent = text
}

export const currentSelection = (): string => window.getSelection()?.toString().trim() || recent