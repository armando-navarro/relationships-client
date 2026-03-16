import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core'
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router'

import { MatNativeDateModule } from '@angular/material/core'
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog'
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon'
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar'
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip'

import { routes } from './app.routes'
import { dialogConfigDefaults, snackbarConfigDefaults, tooltipDefaults } from './shared/material-default-configs'

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(
			routes,
			withComponentInputBinding(),
			withInMemoryScrolling({ anchorScrolling: 'enabled' }),
		),
		importProvidersFrom(MatNativeDateModule),

		{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: dialogConfigDefaults },
		{ provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
		{ provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: snackbarConfigDefaults },
		{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: tooltipDefaults },
	]
}
