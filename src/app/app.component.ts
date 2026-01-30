import { ViewportScroller } from '@angular/common'
import { Component, effect, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'

import { ResponsiveUiService } from './services/responsive-ui.service'

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent {
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly viewportScroller = inject(ViewportScroller)

	constructor() {
		// viewport scroller offset needed to account for fixed header bar height
		effect(() => {
			const offset = this.responsiveUiService.pageHeaderBarHeight()
			this.viewportScroller.setOffset([0, offset])
		})
	}

}
