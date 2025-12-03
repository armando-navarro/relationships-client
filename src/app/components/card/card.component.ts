import { booleanAttribute, Component, computed, inject, input, OnInit, output } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

import { Interaction } from '../../interfaces/interaction.interface'
import { InteractionsService } from '../../services/interactions.service'
import { Relationship } from '../../interfaces/relationship.interface'

@Component({
	selector: 'app-card',
	standalone: true,
	imports: [MatButtonModule, MatIconModule, RouterLink],
	templateUrl: './card.component.html',
	styleUrl: './card.component.scss'
})
export class CardComponent implements OnInit {
	readonly relationship = input<Relationship>()
	readonly interaction = input<Interaction>()
	readonly hideFooter = input(false, { alias: 'hide-footer', transform: booleanAttribute })
	readonly deleteRelationship = output<Relationship>({ alias: 'delete-relationship'})
	readonly deleteInteraction = output<Interaction>({ alias: 'delete-interaction'})

	private readonly interactionsService = inject(InteractionsService)
	private readonly route = inject(ActivatedRoute)

	private isAddingRelationship = false

	readonly editRoute = computed(() => {
		if (this.relationship()) return ['/relationships', this.relationshipId(), 'edit']
		if (this.interaction()) {
			if (this.route.snapshot.data['isAddingRelationship']) return ['/relationships', 'add', 'interactions', 'edit']
			else return ['/relationships', this.interaction()!.idOfRelationship, 'interactions', this.interaction()!._id, 'edit']
		}
		return undefined
	})
	readonly relationshipId = computed(() => this.relationship()?._id || this.interaction()?.idOfRelationship)
	readonly relationshipName = computed(() => this.relationship()?.fullName || this.interaction()?.nameOfPerson)
	readonly modelName = computed(() => this.relationship() ? 'relationship' : 'interaction')

	ngOnInit(): void {
		this.isAddingRelationship = !!this.route.snapshot.data['isAddingRelationship']
	}

	onEditClick(): void {
		if (this.interaction() && this.isAddingRelationship) {
			this.interactionsService.setSelectedInteraction(this.interaction())
		}
	}

	onDeleteClick(): void {
		if (this.relationship()) this.deleteRelationship.emit(this.relationship()!)
		else if (this.interaction()) this.deleteInteraction.emit(this.interaction()!)
		else throw new Error('Either relationship or interaction must exist for deletion.')
	}

}
