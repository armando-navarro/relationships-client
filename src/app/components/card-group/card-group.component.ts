import { booleanAttribute, Component, computed, contentChildren, effect, ElementRef, inject, input, output, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

import { CardComponent } from '../card/card.component'
import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { ScrollService } from '../../services/scroll.service'

@Component({
	selector: 'app-card-group',
	standalone: true,
	imports: [MatButtonModule, MatIconModule],
	templateUrl: './card-group.component.html',
	styleUrl: './card-group.component.scss',
	host: {
		'[attr.aria-labelledby]': '"card-group-title-" + instanceNumber()',
		role: 'region'
	}
})
export class CardGroupComponent {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly scrollService = inject(ScrollService)

	readonly header = input.required<string>()
	readonly headerColor = input('white', { alias: 'header-color' })
	readonly cardCount = input<number>(0, { alias: 'card-count' })
	readonly isCardInGroupHighlighted = input(false, { alias: 'is-card-in-group-highlighted', transform: booleanAttribute })
	readonly groupOf = input<'relationships'|'interactions'>('interactions', { alias: 'group-of' })
	readonly headerClick = output<void>({ alias: 'header-click' })

	readonly cards = contentChildren(CardComponent)

	readonly open = signal(true)
	readonly allCardsOpen = signal(!this.responsiveUiService.isSmallViewport())
	readonly allCardsClosed = signal(this.responsiveUiService.isSmallViewport())
	readonly instanceNumber = signal<number|undefined>(undefined)
	readonly isSmallViewport = this.responsiveUiService.isSmallViewport
	readonly isSmallViewport$ = toObservable(this.responsiveUiService.isSmallViewport).pipe(takeUntilDestroyed())
	readonly maxGroupHeight = computed(() => {
		// take max card/row height into account so group expands tall enough
		if (this.open()) return this.isSmallViewport() ? this.cardCount() * 285 : this.cardCount() * 92 + 59
		else return 0
	})
	readonly scrollingUp = toSignal(this.scrollService.scrollDirection$.pipe(map(scrollDir => scrollDir === 'up')))

	// for assigning a unique ID to elements in each instance of this component
	static instanceCount = 0

	constructor() {
		this.instanceNumber.set(CardGroupComponent.instanceCount++)
		effect(() => {
			if (this.isCardInGroupHighlighted()) this.open.set(true)
		}, { allowSignalWrites: true })

		// track cards collapsed/expanded states when cards added/removed or when card collapsed/expanded
		effect(() => {
			this.cards().forEach(card => {
				card.open() // causes effect to rerun when any card's open state changes
				this.setCardsCollapsedState()
			})
		}, { allowSignalWrites: true })

		// start group closed on small viewports and open on large viewports
		// observable used instead of effect to prevent other signal updates from interfering
		this.isSmallViewport$.subscribe(isSmallViewport => {
			this.open.set(!isSmallViewport)
			this.setCardsCollapsedState()
			this.headerClick.emit()
		})
	}

	onGroupHeaderClick(): void {
		this.open.set(!this.open())
		this.headerClick.emit()
		setTimeout(() => {
			if (this.responsiveUiService.isSmallViewport() && this.open()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
			}
		}, 500) // wait for the CSS transition to complete
	}

	onExpandOrCollapseCardsClick(cardsOpen: boolean): void {
		this.cards().forEach(card => card.open.set(cardsOpen))
		this.setCardsCollapsedState()
	}

	private setCardsCollapsedState(): void {
		this.allCardsOpen.set(this.cards().every(card => card.open()))
		this.allCardsClosed.set(this.cards().every(card => !card.open()))
	}

}
