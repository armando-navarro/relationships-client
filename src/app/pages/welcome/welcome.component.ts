import { Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { ResponsiveUiService } from '../../services/responsive-ui.service'

@Component({
	selector: 'app-welcome',
	standalone: true,
	imports: [MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderBarComponent, RouterLink],
	templateUrl: './welcome.component.html',
	styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
	private readonly responsivUiService = inject(ResponsiveUiService)

	readonly isSmallViewport = toSignal(this.responsivUiService.isSmallViewport$)
	isTableOfContentsOpen = signal(false)

	onTableOfContentsClick(): void {
		this.isTableOfContentsOpen.set(!this.isTableOfContentsOpen())
	}

}
