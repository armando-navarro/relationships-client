import { ViewportScroller } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

import { ResponsiveUiService } from './services/responsive-ui.service'

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly viewportScroller = inject(ViewportScroller)

	private readonly isSmallViewport$ = this.responsiveUiService.isSmallViewport$.pipe(
		takeUntilDestroyed()
	)

	ngOnInit(): void {
		this.isSmallViewport$.subscribe(isSmallViewport => {
			const { smallPageHeaderBarHeight, largePageHeaderBarHeight } = this.responsiveUiService.pageHeaderBarHeight
			const offset = isSmallViewport ? smallPageHeaderBarHeight : largePageHeaderBarHeight
			this.viewportScroller.setOffset([0, offset])
		})
	}

}
