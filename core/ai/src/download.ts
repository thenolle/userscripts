export const saveFile = (name: string, data: BlobPart, type = 'text/plain'): void => {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.hidden = true
  document.body.appendChild(link)

  try {
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}
