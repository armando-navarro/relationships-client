import { booleanAttribute, Component, computed, contentChild, effect, EmbeddedViewRef, inject, input, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { map } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

import { ResponsiveUi } from '../../services/responsive-ui'
import { Scroll } from '../../services/scroll'

@Component({
	selector: 'app-page-header-bar',
	imports: [MatButtonModule, MatIconModule, RouterLink],
	templateUrl: './page-header-bar.html',
	styleUrl: './page-header-bar.scss',
	host: {
		'[class.hidden]': 'hideHeaderBar() && !isDialog()',
		'[class.dialog]': 'isDialog()',
		'[class.two-rows]': 'showSecondRow() && isSmallViewport()',
		'[attr.role]': 'isDialog() ? null : "banner"',
		'[aria-label]': 'isDialog() ? null : "Page title, navigation, and actions"',
	}
})
export class PageHeaderBar {
	private readonly responsiveUi = inject(ResponsiveUi)
	private readonly scroll = inject(Scroll)

	readonly title = input('', { alias: 'page-title' })
	readonly isDialog = input(false, { alias: 'dialog', transform: booleanAttribute })
	readonly showSecondRow = input(false, { alias: 'show-second-row', transform: booleanAttribute })
	readonly justifyContent = input('normal', { alias: 'justify-content' })
	readonly secondRowTemplate = input<TemplateRef<void>|null>(null, { alias: 'second-row-template' })
	readonly alwaysShow = input(false, { alias: 'always-show', transform: booleanAttribute })

	private readonly firstRowViewContainerRef = contentChild('firstRow', { read: ViewContainerRef})
	private readonly secondRowViewContainerRef = viewChild('secondRow', { read: ViewContainerRef})
	private firstRowSearchViewRef: EmbeddedViewRef<void>|null = null
	private secondRowSearchViewRef: EmbeddedViewRef<void>|null = null

	readonly hideHeaderBar = computed(() => !this.alwaysShow() && this.isSmallViewport() && this.scrollingDown())
	readonly scrollingDown = toSignal(this.scroll.scrollDirection$.pipe(map(scrollDir => scrollDir === 'down')))
	readonly isSmallViewport = this.responsiveUi.isSmallViewport

	constructor() {
		effect(() => this.setSearchView())
	}

	/** Sets the search view in the appropriate row based on the viewport size. */
	private setSearchView(): void {
		if (
			!this.firstRowViewContainerRef() ||
			!this.secondRowViewContainerRef() ||
			!this.secondRowTemplate() ||
			this.isSmallViewport() === undefined
		) return

		this.firstRowSearchViewRef?.destroy()
		this.secondRowSearchViewRef?.destroy()

		if (this.isSmallViewport()) {
			this.secondRowSearchViewRef = this.secondRowViewContainerRef()?.createEmbeddedView(this.secondRowTemplate()!)!
		} else {
			this.firstRowSearchViewRef = this.firstRowViewContainerRef()?.createEmbeddedView(this.secondRowTemplate()!)!
		}
	}
}
