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
		'[class.two-rows]': 'showSupplementalRow() && isSmallViewport()',
		'[attr.role]': 'isDialog() ? null : "banner"',
		'[aria-label]': 'isDialog() ? null : "Page title, navigation, and actions"',
	}
})
export class PageHeaderBar {
	private readonly responsiveUi = inject(ResponsiveUi)
	private readonly scroll = inject(Scroll)

	readonly title = input('', { alias: 'page-title' })
	readonly isDialog = input(false, { alias: 'dialog', transform: booleanAttribute })
	readonly showSupplementalRow = input(false, { alias: 'show-supplemental-row', transform: booleanAttribute })
	readonly justifyContent = input('normal', { alias: 'justify-content' })
	readonly supplementalContentTemplate = input<TemplateRef<void>|null>(null, { alias: 'supplemental-content-template' })
	readonly alwaysShow = input(false, { alias: 'always-show', transform: booleanAttribute })

	private readonly firstRowSupplementalContentContainerRef = contentChild('supplementalContentInFirstRow', { read: ViewContainerRef })
	private readonly secondRowSupplementalContentContainerRef = viewChild('supplementalContentInSecondRow', { read: ViewContainerRef })
	private firstRowSupplementalContentViewRef: EmbeddedViewRef<void>|null = null
	private secondRowSupplementalContentViewRef: EmbeddedViewRef<void>|null = null

	readonly hideHeaderBar = computed(() => !this.alwaysShow() && this.isSmallViewport() && this.scrollingDown())
	readonly scrollingDown = toSignal(this.scroll.scrollDirection$.pipe(map(scrollDir => scrollDir === 'down')))
	readonly isSmallViewport = this.responsiveUi.isSmallViewport

	constructor() {
		this.syncSupplementalContentPlacementWithViewportSize()
	}

	/** Keep supplemental content placed in the appropriate row for the current viewport size. */
	private syncSupplementalContentPlacementWithViewportSize(): void {
		effect(() => {
			if (
				!this.firstRowSupplementalContentContainerRef() ||
				!this.secondRowSupplementalContentContainerRef() ||
				!this.supplementalContentTemplate() ||
				this.isSmallViewport() === undefined
			) return

			this.firstRowSupplementalContentViewRef?.destroy()
			this.secondRowSupplementalContentViewRef?.destroy()

			if (this.isSmallViewport()) {
				this.secondRowSupplementalContentViewRef = this.secondRowSupplementalContentContainerRef()?.createEmbeddedView(this.supplementalContentTemplate()!)!
			} else {
				this.firstRowSupplementalContentViewRef = this.firstRowSupplementalContentContainerRef()?.createEmbeddedView(this.supplementalContentTemplate()!)!
			}
		})
	}
}
