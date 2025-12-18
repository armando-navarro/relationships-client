import { booleanAttribute, Component, computed, input, model, output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

import { Interaction } from '../../interfaces/interaction.interface'
import { Relationship } from '../../interfaces/relationship.interface'

@Component({
	selector: 'app-card',
	standalone: true,
	imports: [MatButtonModule, MatIconModule],
	templateUrl: './card.component.html',
	styleUrl: './card.component.scss',
	host: {
		'[class.hidden]': '!open()',
	}
})
export class CardComponent {
	readonly relationship = input<Relationship>()
	readonly interaction = input<Interaction>()
	readonly hideFooter = input(false, { alias: 'hide-footer', transform: booleanAttribute })
	readonly collapsible = input(false, { transform: booleanAttribute })
	readonly collapsedLeftText = input('', { alias: 'collapsed-left' })
	readonly collapsedRightText = input('', { alias: 'collapsed-right' })
	readonly editRelationship = output<Relationship>({ alias: 'edit-relationship'})
	readonly editInteraction = output<Interaction>({ alias: 'edit-interaction'})
	readonly deleteRelationship = output<Relationship>({ alias: 'delete-relationship'})
	readonly deleteInteraction = output<Interaction>({ alias: 'delete-interaction'})
	readonly open = model(true)

	readonly relationshipId = computed(() => this.relationship()?._id || this.interaction()?.idOfRelationship)
	readonly relationshipName = computed(() => this.relationship()?.fullName || this.interaction()?.nameOfPerson)
	readonly modelName = computed(() => this.relationship() ? 'relationship' : 'interaction')

	onEditClick(): void {
		if (this.interaction()) {
			this.editInteraction.emit(this.interaction()!)
		} else if (this.relationship()) {
			this.editRelationship.emit(this.relationship()!)
		}
	}

	onDeleteClick(): void {
		if (this.relationship()) this.deleteRelationship.emit(this.relationship()!)
		else if (this.interaction()) this.deleteInteraction.emit(this.interaction()!)
		else throw new Error('Either relationship or interaction must exist for deletion.')
	}

	onCollapseExpandClick(): void {
		this.open.set(!this.open())
	}

}
