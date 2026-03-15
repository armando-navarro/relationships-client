import { Component, computed, effect, ElementRef, inject, input, model, output } from '@angular/core'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { Interaction } from '../../interactions/interaction-interface'
import { Relationship } from '../../relationships/relationship-interface'
import { SimpleDatePipe } from '../simple-date-pipe'
import { TopicButtons } from '../../topics/topic-buttons/topic-buttons'

/** This component represents a relationship or an interaction in a table-like structure. */
@Component({
	selector: 'app-row',
	imports: [MatButtonModule, MatIconModule, MatTooltipModule, TopicButtons, SimpleDatePipe],
	templateUrl: './row.html',
	styleUrl: './row.scss',
	host: {
		'[class.relationship]': 'relationship()',
		'[class.interaction]': 'interaction()',
		'[class.highlight]': 'scrollToAndHighlight()',
	}
})
export class Row {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)

	readonly relationship = input<Relationship>()
	readonly interaction = input<Interaction>()

	readonly scrollToAndHighlight = model(false, { alias: 'scroll-to-and-highlight' })

	readonly editRelationshipEmitter = output<Relationship>({ alias: 'edit-relationship'})
	readonly editInteraction = output<Interaction>({ alias: 'edit-interaction'})
	readonly relationshipNameClick = output<Interaction>({ alias: 'relationship-name-click' })
	readonly deleteRelationship = output<Relationship>({ alias: 'delete-relationship'})
	readonly deleteInteraction = output<Interaction>({ alias: 'delete-interaction'})

	protected readonly modelName = computed(() => {
		if (this.relationship()) return 'relationship'
		return 'interaction'
	})

	constructor() {
		this.scrollToAndClearHighlightWhenHighlighted()
	}

	/** When highlighted, scroll to this row and clear the highlight after the animation completes. */
	private scrollToAndClearHighlightWhenHighlighted(): void {
		effect(() => {
			if (this.scrollToAndHighlight()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
				setTimeout(() => this.scrollToAndHighlight.set(false), 2250)
			}
		})
	}

	/** Emit the relationship-name action for the interaction shown in this row. */
	protected editRelationship() {
		this.relationshipNameClick.emit(this.interaction()!)
	}

	/** Emit the edit action for the model rendered by this row. */
	protected edit() {
		if (this.interaction()) this.editInteraction.emit(this.interaction()!)
		else if (this.relationship()) this.editRelationshipEmitter.emit(this.relationship()!)
	}

	/** Emit the delete action for the model rendered by this row. */
	protected delete() {
		if (this.relationship()) this.deleteRelationship.emit(this.relationship()!)
		else if (this.interaction()) this.deleteInteraction.emit(this.interaction()!)
	}

}
