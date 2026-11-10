import { responseSpy } from './network'
import { ChatSession } from './session'

responseSpy.install()

export const session = new ChatSession(responseSpy)
