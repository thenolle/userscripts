export interface SseMessage {
  readonly event: string | null
  readonly data: string
}

export class SseParser {
  private buffer = ''

  push(chunk: string): SseMessage[] {
    this.buffer += chunk.replace(/\r\n/g, '\n')
    const blocks = this.buffer.split('\n\n')
    this.buffer = blocks.pop() ?? ''
    return blocks.flatMap((block) => this.parseBlock(block))
  }

  flush(): SseMessage[] {
    const rest = this.buffer
    this.buffer = ''
    return rest.trim() ? this.parseBlock(rest) : []
  }

  private parseBlock(block: string): SseMessage[] {
    let event: string | null = null
    const data: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
    }
    return data.length ? [{ event, data: data.join('\n') }] : []
  }
}
