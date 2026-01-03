import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, OnInit, output, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'

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
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	private readonly responsiveUiService = inject(ResponsiveUiService)

	readonly header = input.required<string>()
	readonly headerColor = input('white', { alias: 'header-color' })
	readonly cardCount = input<number>(0, { alias: 'card-count' })
	readonly isCardInGroupHighlighted = input(false, { alias: 'is-card-in-group-highlighted', transform: booleanAttribute })
	readonly headerClick = output<void>({ alias: 'header-click' })

	readonly open = signal(true)
	readonly instanceNumber = signal<number|undefined>(undefined)
	readonly isSmallViewport = toSignal(this.responsiveUiService.isSmallViewport$)
	readonly maxGroupHeight = computed(() => {
		// small viewport: take max card height into account so group expands tall enough
		// large viewport: fixed height since cards scroll horizontally
		if (this.open()) return this.isSmallViewport() ? this.cardCount() * 285 : 300
		else return 0
	})

	// for assigning a unique ID to elements in each instance of this component
	static instanceCount = 0
	constructor() {
		this.instanceNumber.set(CardGroupComponent.instanceCount++)
		effect(() => {
			if (this.isCardInGroupHighlighted()) this.open.set(true)
		}, { allowSignalWrites: true })
	}

	ngOnInit(): void {
		// card groups should start off closed on small viewports
		this.open.set(!this.responsiveUiService.isSmallViewport())
	}

	onGroupHeaderClick(): void {
		this.open.set(!this.open())
		this.headerClick.emit()
		setTimeout(() => {
			if (this.responsiveUiService.isSmallViewport() && this.open()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth' })
			}
		}, 500) // wait for the CSS transition to complete
	}

}
