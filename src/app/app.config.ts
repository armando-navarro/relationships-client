import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'

import { MatNativeDateModule } from '@angular/material/core'
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip'

import { routes } from './app.routes'
import { tooltipDefaults } from './constants/material-default-configs'

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes, withComponentInputBinding()),
		provideHttpClient(),
		provideAnimationsAsync(),
		importProvidersFrom(MatNativeDateModule),

		{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: tooltipDefaults },
	]
}
