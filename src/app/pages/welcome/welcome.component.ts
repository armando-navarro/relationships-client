import { Component, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'

@Component({
	selector: 'app-welcome',
	standalone: true,
	imports: [MatButtonModule, MatIconModule, PageHeaderBarComponent, RouterLink],
	templateUrl: './welcome.component.html',
	styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
	isTableOfContentsOpen = signal(false)

	onTableOfContentsClick(): void {
		this.isTableOfContentsOpen.set(!this.isTableOfContentsOpen())
	}

}
