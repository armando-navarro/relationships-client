import { booleanAttribute, Component, computed, contentChild, effect, EmbeddedViewRef, inject, input, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { ScrollService } from '../../services/scroll.service'
import { RouterLink } from "@angular/router";

@Component({
	selector: 'app-page-header-bar',
	standalone: true,
	imports: [MatButtonModule, MatIconModule, RouterLink],
	templateUrl: './page-header-bar.component.html',
	styleUrl: './page-header-bar.component.scss',
	host: {
		'[class.hidden]': 'hideHeaderBar() && !isDialog()',
		'[class.dialog]': 'isDialog()',
		'[class.two-rows]': 'showSecondRow() && isSmallViewport()',
		'[attr.role]': 'isDialog() ? null : "banner"',
		'[aria-label]': 'isDialog() ? null : "Page title, navigation, and actions"',
	}
})
export class PageHeaderBarComponent {
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly scrollService = inject(ScrollService)

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
	readonly scrollingDown = toSignal(this.scrollService.scrollDirection$.pipe(map(scrollDir => scrollDir === 'down')))
	readonly isSmallViewport = toSignal(this.responsiveUiService.isSmallViewport$)

	constructor() {
		effect(() => this.setSearchView(), { allowSignalWrites: true})
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
