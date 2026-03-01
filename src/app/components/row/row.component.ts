import { Component, computed, effect, ElementRef, inject, input, model, output } from '@angular/core'

import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { Interaction } from '../../interfaces/interaction.interface'
import { Relationship } from '../../interfaces/relationship.interface'
import { SimpleDatePipe } from "../../pipes/simple-date.pipe"
import { TopicButtonsComponent } from "../topic-buttons/topic-buttons.component"

/** This component represents a relationship or an interaction in a table-like structure. */
@Component({
	selector: 'app-row',
	standalone: true,
	imports: [MatButtonModule, MatIconModule, MatTooltipModule, TopicButtonsComponent, SimpleDatePipe],
	templateUrl: './row.component.html',
	styleUrl: './row.component.scss',
	host: {
		'[class.relationship]': 'relationship()',
		'[class.interaction]': 'interaction()',
		'[class.highlight]': 'scrollToAndHighlight()',
	}
})
export class RowComponent {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)

	readonly relationship = input<Relationship>()
	readonly interaction = input<Interaction>()

	readonly scrollToAndHighlight = model(false, { alias: 'scroll-to-and-highlight' })

	readonly editRelationship = output<Relationship>({ alias: 'edit-relationship'})
	readonly editInteraction = output<Interaction>({ alias: 'edit-interaction'})
	readonly relationshipNameClick = output<Interaction>({ alias: 'relationship-name-click' })
	readonly deleteRelationship = output<Relationship>({ alias: 'delete-relationship'})
	readonly deleteInteraction = output<Interaction>({ alias: 'delete-interaction'})

	readonly modelName = computed(() => {
		if (this.relationship()) return 'relationship'
		return 'interaction'
	})

	constructor() {
		// highlight card
		effect(() => {
			if (this.scrollToAndHighlight()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
				setTimeout(() => this.scrollToAndHighlight.set(false), 2250)
			}
		})
	}

	onRelationshipNameClick() {
		this.relationshipNameClick.emit(this.interaction()!)
	}

	onEditClick() {
		if (this.interaction()) this.editInteraction.emit(this.interaction()!)
		else if (this.relationship()) this.editRelationship.emit(this.relationship()!)
	}

	onDeleteClick() {
		if (this.relationship()) this.deleteRelationship.emit(this.relationship()!)
		else if (this.interaction()) this.deleteInteraction.emit(this.interaction()!)
	}

}
