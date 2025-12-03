import { Component, inject, input, OnInit, signal } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { Location } from '@angular/common'
import { MatButtonModule } from '@angular/material/button'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from "@angular/material/input"
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { Interaction } from "../../interfaces/interaction.interface"
import { InteractionType } from "../../interfaces/interaction.interface"
import { InteractionsService } from '../../services/interactions.service'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { Relationship } from '../../interfaces/relationship.interface'
import { RelationshipsService } from '../../services/relationships.service'
import { REQUIRED_ERROR, SNACKBAR_CONFIG } from '../../constants/misc-constants'
import { Topic } from "../../interfaces/interaction.interface"

@Component({
	selector: 'app-edit-interaction',
	standalone: true,
	imports: [
		FormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatIconModule,
		MatInputModule, PageHeaderBarComponent, RouterLink
	],
	templateUrl: './edit-interaction.component.html',
	styleUrl: './edit-interaction.component.scss'
})

export class EditInteractionComponent implements OnInit {
	readonly relationshipId = input<string>() // route parameter
	readonly interactionId = input<string>() // route parameter

	readonly interaction = signal<Interaction|undefined>(undefined)
	readonly relationships = signal<Relationship[]|undefined>(undefined)

	private isAddingInteraction = false
	private isAddingRelationship = false
	readonly pageHeading = signal('')
	readonly showRelationshipPicker = signal(false)

	private readonly api = inject(ApiService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly location = inject(Location)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly route = inject(ActivatedRoute)
	private readonly snackBar = inject(MatSnackBar)

	readonly typeOptions = InteractionType

	private readonly RELATIONSHIP_ERROR = 'Failed to load relationships. Try again later.'
	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_INTERACTION_ERROR = 'Failed to save interaction. Please try again.'
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG

	// These properties hold the edited values before saving
	dateValue: Date|undefined
	relationshipIdValue = ''
	topicsValue: Topic[] = []
	typeValue: InteractionType|undefined

	ngOnInit(): void {
		this.isAddingInteraction = this.route.snapshot.data['isAddingInteraction']
		this.isAddingRelationship = this.route.snapshot.data['isAddingRelationship']
		this.pageHeading.set(this.isAddingInteraction ? 'Add Interaction' : 'Edit Interaction')
		this.showRelationshipPicker.set(this.route.snapshot.url[0].path === 'interactions')

		if (this.isAddingRelationship) {
			if (!this.isAddingInteraction) {
				this.interactionsService.getSelectedInteraction().subscribe({
					next: interaction => {
						this.interaction.set(interaction)
						this.initFormValues()
					},
					// page was refreshed, so selected interaction was cleared: go back to add relationship page
					error: error => this.location.back()
				})
			}
		} else {
			if (this.isAddingInteraction) {
				this.initFormValues()
			} else {
				this.interactionsService.getSelectedInteraction(this.relationshipId()!, this.interactionId()!).subscribe(interaction => {
					this.interaction.set(interaction)
					this.initFormValues()
				})
			}
		}
	}

	private initFormValues(): void {
		if (this.isAddingInteraction) {
			this.interaction.set({
				idOfRelationship: this.relationshipId(),
				date: undefined,
				type: undefined,
				topicsDiscussed: [],
			})
			if (this.showRelationshipPicker()) this.loadRelationships()
		}
		this.dateValue = this.interaction()?.date
		this.typeValue = this.interaction()?.type
		this.topicsValue = this.interaction()?.topicsDiscussed || []
		this.interaction()?.topicsDiscussed?.forEach(topic =>
			topic.notes = topic.notes?.replaceAll('<br />', '\n')
		)
	}

	private loadRelationships(): void {
		this.api.getRelationshipsGroupedByStatus().subscribe({
			next: groupedRelationships => {
				const relationships = Object.values(groupedRelationships).reduce(
					(accumulator, current) => accumulator.concat(current.relationships),
					[] as Relationship[]
				)
				const sortedRels = this.relationshipsService.sortByFirstName(relationships)
				this.relationships.set(sortedRels)
			},
			error: error => this.snackBar.open(this.RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
		})
	}

	onCancelClick(): void {
		this.location.back()
	}

	onSaveClick(): void {
		if (!this.isFormValid()) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return
		}

		this.topicsValue.forEach(topic => {
			topic.topic = topic.topic.trim()
			topic.notes = topic.notes?.trim()
		})
		const interaction: Interaction = {
			_id: this.interaction()?._id,
			idOfRelationship: this.interaction()?.idOfRelationship || this.relationshipIdValue,
			date: this.dateValue,
			type: this.typeValue,
			topicsDiscussed: this.topicsValue,
		}

		if (this.isAddingRelationship) this.saveInteractionInMemory(interaction)
		else this.persistInteractionRemotely(interaction)
	}

	private saveInteractionInMemory(newInteraction: Interaction): void {
		// interaction will be persisted later when the new relationship is persisted
		if (this.isAddingInteraction) {
			this.interactionsService.addInteractionToUnsavedRelationship(newInteraction)
		} else { // user is editing a relationship
			this.interaction()!.date = this.dateValue,
			this.interaction()!.type = this.typeValue,
			this.interaction()!.topicsDiscussed = this.topicsValue
		}
		this.location.back()
	}

	private persistInteractionRemotely(newInteraction: Interaction): void {
		if (this.isAddingInteraction) {
			this.api.addInteraction(newInteraction).subscribe({
				next: () => this.location.back(),
				error: error => this.snackBar.open(this.SAVE_INTERACTION_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		} else {
			this.api.updateInteraction(newInteraction).subscribe({
				next: () => this.location.back(),
				error: error => this.snackBar.open(this.SAVE_INTERACTION_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		}
	}

	private isFormValid(): boolean {
		const areTopicsValid = !this.topicsValue.some(({ topic }) => !topic.trim())
		const isRelationshipValid = !this.showRelationshipPicker() || !!this.relationshipIdValue
		return areTopicsValid && !!this.dateValue && !!this.typeValue && isRelationshipValid
	}

	onAddTopicClick(): void {
		this.topicsValue.unshift({ topic: '', notes: '' })
	}

	onRemoveTopicClick(index: number): void {
		const snackBarRef = this.snackBar.open('Topic removed', 'Undo', this.SNACKBAR_CONFIG)
		const removedTopic = this.topicsValue.splice(index, 1)[0]
		snackBarRef.onAction().subscribe(() => this.topicsValue.splice(index, 0, removedTopic))
	}

}
