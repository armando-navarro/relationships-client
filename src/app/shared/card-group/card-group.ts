import { booleanAttribute, Component, computed, contentChildren, effect, ElementRef, inject, input, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

import { Card } from '../card/card'
import { ResponsiveUi } from '../responsive-ui'
import { Scroll } from '../scroll'

@Component({
	selector: 'app-card-group',
	imports: [MatButtonModule, MatIconModule],
	templateUrl: './card-group.html',
	styleUrl: './card-group.scss',
	host: {
		'[aria-labelledby]': '"card-group-title-" + instanceNumber()',
		role: 'region'
	}
})
export class CardGroup {
	// services/dependencies
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	protected readonly responsiveUi = inject(ResponsiveUi)
	private readonly scroll = inject(Scroll)

	// inputs/outputs
	readonly header = input.required<string>()
	readonly headerColor = input('white', { alias: 'header-color' })
	readonly cardCount = input<number>(0, { alias: 'card-count' })
	readonly isCardInGroupHighlighted = input(false, { alias: 'is-card-in-group-highlighted', transform: booleanAttribute })
	readonly groupOf = input<'relationships'|'interactions'>('interactions', { alias: 'group-of' })

	// queries
	readonly cards = contentChildren(Card)

	// state
	readonly open = signal(true)
	protected readonly showExpandAllCardsButton = signal(!this.responsiveUi.isSmallViewport())
	protected readonly showCollapseAllCardsButton = signal(this.responsiveUi.isSmallViewport())
	protected readonly instanceNumber = signal<number|undefined>(undefined)
	protected readonly maxGroupHeight = computed(() => {
		// take max card/row height into account so group expands tall enough
		if (this.open()) return this.responsiveUi.isSmallViewport() ? this.cardCount() * 285 : this.cardCount() * 92 + 59
		else return 0
	})
	protected readonly scrollingUp = toSignal(this.scroll.scrollDirection$.pipe(map(scrollDir => scrollDir === 'up')))

	// for assigning a unique ID to elements in each instance of this component
	static instanceCount = 0

	constructor() {
		this.instanceNumber.set(CardGroup.instanceCount++)
		this.openGroupWhenCardHighlighted()
		this.syncExpandCollapseAllButtonsWithCardStates()
		this.syncGroupOpenStateWithViewportSize()
	}

	/** When a card in this group is being highlighted, expand the card group. */
	private openGroupWhenCardHighlighted(): void {
		effect(() => {
			if (this.isCardInGroupHighlighted()) this.open.set(true)
		})
	}

	/** Update visibility of "expand/collapse all cards" buttons when cards are added/removed or when a card is collapsed/expanded */
	private syncExpandCollapseAllButtonsWithCardStates(): void {
		effect(() => {
			this.showExpandAllCardsButton.set(!this.cards().every(card => card.open()))
			this.showCollapseAllCardsButton.set(!this.cards().every(card => !card.open()))
		})
	}

	/** Expand group on large viewports and collapse group on small viewports. */
	private syncGroupOpenStateWithViewportSize(): void {
		effect(() => this.open.set(!this.responsiveUi.isSmallViewport()))
	}

	/** Toggles the collapse/expand state of the group and scrolls the group into view on small viewports when expanded. */
	protected toggleGroupCollapseExpand(): void {
		this.open.set(!this.open())
		setTimeout(() => {
			if (this.responsiveUi.isSmallViewport() && this.open()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
			}
		}, 500) // wait for the CSS transition to complete
	}

	/** Expands or collapses all cards in the group. */
	protected expandOrCollapseAllCards(cardsOpen: boolean): void {
		this.cards().forEach(card => card.open.set(cardsOpen))
	}

}
