import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, model, output } from '@angular/core'
import { NgStyle } from '@angular/common'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { DynamicScrollableComponent } from "../dynamic-scrollable/dynamic-scrollable.component"
import { Interaction } from '../../interfaces/interaction.interface'
import { Relationship } from '../../interfaces/relationship.interface'

@Component({
	selector: 'app-card',
	standalone: true,
	imports: [DynamicScrollableComponent, MatButtonModule, MatIconModule, MatTooltipModule, NgStyle],
	templateUrl: './card.component.html',
	styleUrl: './card.component.scss',
	host: {
		'[class.hidden]': '!open()',
		'[class.highlight]': 'scrollToAndHighlight()',
	}
})
export class CardComponent {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)

	readonly relationship = input<Relationship>()
	readonly interaction = input<Interaction>()
	readonly hideFooter = input(false, { alias: 'hide-footer', transform: booleanAttribute })
	readonly collapsible = input(false, { transform: booleanAttribute })
	readonly scrollableBody = input(false, { alias: 'scrollable-body', transform: booleanAttribute })
	readonly collapsedLeftText = input('', { alias: 'collapsed-left-text' })
	readonly collapsedRightText = input('', { alias: 'collapsed-right-text' })
	readonly collapsedRightIcon = input('', { alias: 'collapsed-right-icon' })
	readonly alwaysShowLeftText = input(false, { alias: 'always-show-left-text', transform: booleanAttribute })
	readonly scrollToAndHighlight = model(false, { alias: 'scroll-to-and-highlight' })

	readonly editRelationship = output<Relationship>({ alias: 'edit-relationship'})
	readonly editInteraction = output<Interaction>({ alias: 'edit-interaction'})
	readonly editTopic = output({ alias: 'edit-topic'})
	readonly deleteRelationship = output<Relationship>({ alias: 'delete-relationship'})
	readonly deleteInteraction = output<Interaction>({ alias: 'delete-interaction'})
	readonly deleteTopic = output({ alias: 'delete-topic'})

	readonly open = model(true)

	readonly relationshipId = computed(() => this.relationship()?._id || this.interaction()?.idOfRelationship)
	readonly relationshipName = computed(() => this.relationship()?.fullName || this.interaction()?.nameOfPerson)
	readonly modelName = computed(() => {
		if (this.relationship()) return 'relationship'
		else if (this.interaction()) return 'interaction'
		else return 'topic'
	})

	constructor() {
		effect(() => {
			if (this.scrollToAndHighlight()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
				setTimeout(() => this.scrollToAndHighlight.set(false), 2250)
			}
		})
	}

	onEditClick(): void {
		if (this.interaction()) this.editInteraction.emit(this.interaction()!)
		else if (this.relationship()) this.editRelationship.emit(this.relationship()!)
		else this.editTopic.emit()
	}

	onDeleteClick(): void {
		if (this.relationship()) this.deleteRelationship.emit(this.relationship()!)
		else if (this.interaction()) this.deleteInteraction.emit(this.interaction()!)
		else this.deleteTopic.emit()
	}

	onCollapseExpandClick(): void {
		this.open.set(!this.open())
		setTimeout(() => {
			this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}, 500) // wait for the CSS transition to complete
	}

}
