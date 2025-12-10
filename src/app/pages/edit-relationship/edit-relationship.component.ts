import { Component, inject, input, OnInit, signal } from '@angular/core'
import { Location } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../../components/card/card.component'
import { Interaction } from "../../interfaces/interaction.interface"
import { InteractionCardContentComponent } from '../../components/interaction-card-content/interaction-card-content.component'
import { InteractionRate } from "../../interfaces/interaction.interface"
import { InteractionsService } from '../../services/interactions.service'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { Relationship } from '../../interfaces/relationship.interface'
import { RelationshipsService } from '../../services/relationships.service'
import { REQUIRED_ERROR, SNACKBAR_CONFIG, TOPIC_HINT_VERBIAGE } from '../../constants/misc-constants'

@Component({
	selector: 'app-edit-relationship',
	standalone: true,
	imports: [
		CardComponent, FormsModule, InteractionCardContentComponent, MatButtonModule,
		MatIconModule, MatFormFieldModule, MatInputModule, PageHeaderBarComponent, RouterLink
	],
	templateUrl: './edit-relationship.component.html',
	styleUrl: './edit-relationship.component.scss'
})
export class EditRelationshipComponent implements OnInit {
	readonly relationshipId = input<string>() // route parameter

	readonly relationship = signal<Relationship|undefined>(undefined)
	readonly isAddMode = signal(false)

	private readonly api = inject(ApiService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly location = inject(Location)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly route = inject(ActivatedRoute)
	private readonly router = inject(Router)
	private readonly snackBar = inject(MatSnackBar)

	// These properties hold the form values before saving
	firstNameValue = ''
	lastNameValue = ''
	interactionRateGoalValue: InteractionRate|undefined
	notesValue = ''
	interactionsValue: Interaction[] = []

	readonly InteractionRates = InteractionRate

	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_RELATIONSHIP_ERROR = 'Failed to save relationship. Please try again.'
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG
	readonly TOPIC_HINT_VERBIAGE = TOPIC_HINT_VERBIAGE

	ngOnInit(): void {
		this.isAddMode.set(!this.relationshipId())
		if (this.isAddMode()) {
			if (this.relationshipsService.unsavedRelationship()) {
				this.initFormValues(this.relationshipsService.unsavedRelationship())
			} else {
				this.relationship.set({
					interactions: this.interactionsService.interactionsForUnsavedRelationship().sort(
						this.interactionsService.sortInteractionsDesc
					)
				})
				this.initFormValues(this.relationship())
			}
		} else {
			this.api.getRelationship(this.relationshipId()!).subscribe(relationship => {
				this.relationship.set(relationship)
				this.initFormValues(this.relationship())
			})
		}
	}

	private initFormValues(relationship: Relationship|undefined): void {
		this.firstNameValue = relationship?.firstName || ''
		this.lastNameValue = relationship?.lastName || ''
		this.interactionRateGoalValue = relationship?.interactionRateGoal
		this.notesValue = relationship?.notes?.replaceAll('<br />', '\n') || ''
		this.interactionsValue = relationship?.interactions || this.interactionsService.interactionsForUnsavedRelationship() || []
	}

	onCancelClick(): void {
		this.relationshipsService.unsavedRelationship.set(undefined)
		this.interactionsService.interactionsForUnsavedRelationship.set([])
		this.location.back()
	}

	onSaveClick(): void {
		if (!this.isFormValid()) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return
		}
		const relationship: Relationship = {
			_id: this.relationship()?._id,
			firstName: this.firstNameValue.trim(),
			lastName: this.lastNameValue.trim(),
			interactionRateGoal: this.interactionRateGoalValue,
			notes: this.notesValue.trim(),
			interactions: this.interactionsValue || [],
		}

		if (this.isAddMode()) {
			this.api.addRelationship(relationship).subscribe({
				next: () => {
					this.relationshipsService.unsavedRelationship.set(undefined)
					this.interactionsService.interactionsForUnsavedRelationship.set([])
					this.location.back()
				},
				error: error => this.snackBar.open(this.SAVE_RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		} else {
			this.api.updateRelationship(relationship).subscribe({
				next: () => {
					this.relationshipsService.unsavedRelationship.set(undefined)
					this.interactionsService.interactionsForUnsavedRelationship.set([])
					this.location.back()
				},
				error: error => this.snackBar.open(this.SAVE_RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		}
	}

	onAddInteractionClick(): void {
		this.relationshipsService.unsavedRelationship.set({
			firstName: this.firstNameValue,
			lastName: this.lastNameValue,
			interactionRateGoal: this.interactionRateGoalValue,
			notes: this.notesValue,
			interactions: this.interactionsValue,
		})
		this.router.navigate([this.isAddMode() ? './' : '../', 'interactions','add'], { relativeTo: this.route })
	}

	onDeleteInteractionClick(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(deleteTarget).subscribe({
			next: targetDeleted => {
				if (!targetDeleted) return

				let deleteIndex = this.relationship()?.interactions?.findIndex(({ _id }) => _id === deleteTarget._id)
				if (deleteIndex !== undefined && deleteIndex > -1) this.relationship()?.interactions?.splice(deleteIndex, 1)
			},
			error: error => this.snackBar.open('Failed to delete interaction. Try again.', undefined, this.SNACKBAR_CONFIG)
		})
	}

	private isFormValid(): boolean {
		return !!this.firstNameValue
	}

}
