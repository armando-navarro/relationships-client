import { ViewportScroller } from '@angular/common'
import { Component, effect, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'

import { ResponsiveUi } from './services/responsive-ui'

@Component({
	selector: 'app-root',
	imports: [RouterOutlet],
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App {
	private readonly responsiveUi = inject(ResponsiveUi)
	private readonly viewportScroller = inject(ViewportScroller)

	constructor() {
		// viewport scroller offset needed to account for fixed header bar height
		effect(() => {
			const offset = this.responsiveUi.pageHeaderBarHeight()
			this.viewportScroller.setOffset([0, offset])
		})
	}

}
