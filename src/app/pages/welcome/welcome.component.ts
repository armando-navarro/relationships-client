import { Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { ResponsiveUiService } from '../../services/responsive-ui.service'

@Component({
	selector: 'app-welcome',
	imports: [MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderBarComponent, RouterLink],
	templateUrl: './welcome.component.html',
	styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
	private readonly responsivUiService = inject(ResponsiveUiService)

	readonly isSmallViewport = this.responsivUiService.isSmallViewport
	isTableOfContentsOpen = signal(false)

	onTableOfContentsLinkClick({ target }: Event): void {
		if (target instanceof HTMLUListElement || target instanceof HTMLLIElement) return
		this.isTableOfContentsOpen.set(false)
	}

}
