import { Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { PageHeaderBar } from '../../components/page-header-bar/page-header-bar'
import { ResponsiveUi } from '../../services/responsive-ui'

@Component({
	selector: 'app-welcome',
	imports: [MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderBar, RouterLink],
	templateUrl: './welcome.html',
	styleUrl: './welcome.scss'
})
export class Welcome {
	private readonly responsiveUi = inject(ResponsiveUi)

	protected readonly isSmallViewport = this.responsiveUi.isSmallViewport
	protected isTableOfContentsOpen = signal(false)

	protected closeTableOfContents({ target }: Event): void {
		if (target instanceof HTMLUListElement || target instanceof HTMLLIElement) return
		this.isTableOfContentsOpen.set(false)
	}

}
