import { App } from './app'
import { DiagnosticsFeature } from './features/diagnostics'
import { responseSpy } from './network'
import { ChatSession } from './session'

responseSpy.install()

const session = new ChatSession(responseSpy)

new App()
	.register((context) => new DiagnosticsFeature(context, session))
	.start()
