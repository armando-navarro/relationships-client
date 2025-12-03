import { Component, inject, input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

import { ScrollService } from '../../services/scroll.service'

@Component({
	selector: 'app-page-header-bar',
	standalone: true,
	imports: [],
	templateUrl: './page-header-bar.component.html',
	styleUrl: './page-header-bar.component.scss',
	host: {
		'[class.hidden]': 'hideHeaderBar()',
		'role': 'banner',
		'aria-label': 'Page title, navigation, and actions',
	}
})
export class PageHeaderBarComponent {
	readonly title = input('')
	readonly justifyContent = input('normal', { alias: 'justify-content' })
	private readonly scrollService = inject(ScrollService)
	readonly hideHeaderBar = toSignal(this.scrollService.scrollDirection$.pipe(map(scrollDir => scrollDir === 'down')))
}
