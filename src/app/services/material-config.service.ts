import { inject, Injectable } from '@angular/core'

import { MatDialogConfig } from '@angular/material/dialog'

import { ResponsiveUiService } from './responsive-ui.service'

@Injectable({ providedIn: 'root' })
export class MaterialConfigService {
	private readonly responsiveUiService = inject(ResponsiveUiService)

	/** Config differs based on viewport size. Default configs are provided in `app.config.ts`. */
	getResponsiveDialogConfig(data?: object): MatDialogConfig {
		const config: MatDialogConfig = {}
		if (data) config.data = data
		if (this.responsiveUiService.isSmallViewport()) config.maxHeight = '100vh'

		return config
	}

}
