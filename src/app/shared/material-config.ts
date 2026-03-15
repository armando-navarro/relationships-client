import { inject, Injectable } from '@angular/core'

import { MatDialogConfig } from '@angular/material/dialog'

import { ResponsiveUi } from './responsive-ui'

@Injectable({ providedIn: 'root' })
export class MaterialConfig {
	private readonly responsiveUi = inject(ResponsiveUi)

	/** Config differs based on viewport size. Default configs are provided in `app.config.ts`. */
	getResponsiveDialogConfig(data?: object): MatDialogConfig {
		const config: MatDialogConfig = {}
		if (data) config.data = data
		if (this.responsiveUi.isSmallViewport()) config.maxHeight = '100vh'

		return config
	}

}
