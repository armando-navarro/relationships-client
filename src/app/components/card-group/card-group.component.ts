import { Component, ElementRef, inject, input, model, OnInit, signal } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ResponsiveUiService } from '../../services/responsive-ui.service'

@Component({
	selector: 'app-card-group',
	standalone: true,
	imports: [MatIconModule],
	templateUrl: './card-group.component.html',
	styleUrl: './card-group.component.scss',
	host: {
		'[attr.aria-labelledby]': '"card-group-title-" + instanceNumber()',
		role: 'region'
	}
})
export class CardGroupComponent implements OnInit {
	readonly header = input.required<string>()
	readonly headerColor = input('white', { alias: 'header-color' })
	readonly cardCount = input<number>(0, { alias: 'card-count' })
	readonly open = model(true)

	readonly instanceNumber = signal<number|undefined>(undefined)

	readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	readonly responsiveUiService = inject(ResponsiveUiService)

	// for assigning a unique ID to elements in each instance of this component
	static instanceCount = 0
	constructor() {
		this.instanceNumber.set(CardGroupComponent.instanceCount++)
	}

	ngOnInit(): void {
		// card groups should start off closed on small viewports
		this.open.set(!this.responsiveUiService.isSmallViewport())
	}

	onGroupHeaderClick(): void {
		this.open.set(!this.open())
		setTimeout(() => {
			if (this.responsiveUiService.isSmallViewport() && this.open()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth' })
			}
		}, 500) // wait for the CSS transition to complete
	}

}
