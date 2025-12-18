import { booleanAttribute, Component, inject, input } from '@angular/core'
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
		'[class.hidden]': 'hideHeaderBar() && !isDialog()',
		'[class.dialog]': 'isDialog()',
		'[attr.role]': 'isDialog() ? null : "banner"',
		'[aria-label]': 'isDialog() ? null : "Page title, navigation, and actions"',
	}
})
export class PageHeaderBarComponent {
	readonly title = input('')
	readonly isDialog = input(false, { alias: 'dialog', transform: booleanAttribute })
	readonly justifyContent = input('normal', { alias: 'justify-content' })
	private readonly scrollService = inject(ScrollService)
	readonly hideHeaderBar = toSignal(this.scrollService.scrollDirection$.pipe(map(scrollDir => scrollDir === 'down')))
}
