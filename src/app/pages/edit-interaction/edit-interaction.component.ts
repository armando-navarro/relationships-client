import { Component, inject, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from "@angular/material/input"
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { Interaction, InteractionPayload } from "../../interfaces/interaction.interface"
import { InteractionMapperService } from '../../services/mappers/interaction.mapper.service'
import { InteractionType } from "../../interfaces/interaction.interface"
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { Relationship } from '../../interfaces/relationship.interface'
import { RelationshipsService } from '../../services/relationships.service'
import { REQUIRED_ERROR, SNACKBAR_CONFIG } from '../../constants/misc-constants'

export interface InteractionDialogData {
	relationshipId: string|null
	interactionId: string|null
	interaction: Interaction|null
	isAddingInteraction?: true
	isEditingInteraction?: true
	showRelationshipPicker?: true
}

@Component({
	selector: 'app-edit-interaction',
	standalone: true,
	imports: [
    MatButtonModule, MatDatepickerModule, MatDialogContent, MatDialogActions,
		MatDialogClose, MatFormFieldModule, MatIconModule, MatInputModule,
		PageHeaderBarComponent, ReactiveFormsModule,
],
	templateUrl: './edit-interaction.component.html',
	styleUrl: './edit-interaction.component.scss'
})

export class EditInteractionComponent implements OnInit {
	private readonly api = inject(ApiService)
	readonly data = inject<InteractionDialogData>(MAT_DIALOG_DATA)
	private readonly dialogRef = inject(MatDialogRef)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly snackBar = inject(MatSnackBar)

	form = this.interactionMapper.mapModelToForm()
	readonly relationships = signal<Relationship[]|undefined>(undefined)
	readonly pageHeading = signal('')
	readonly typeOptions = InteractionType

	private readonly RELATIONSHIP_ERROR = 'Failed to load relationships. Try again later.'
	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_INTERACTION_ERROR = 'Failed to save interaction. Please try again.'
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG

	ngOnInit(): void {
		if (this.data.showRelationshipPicker) this.loadRelationships()

		if (this.data.isAddingInteraction) {
			this.initAddInteraction()
		} else if (this.data.isEditingInteraction) {
			this.initEditInteraction()
		}
		this.pageHeading.set(this.data.isAddingInteraction ? 'Add Interaction' : 'Edit Interaction')
	}

	private initAddInteraction(): void {
		this.form = this.interactionMapper.mapModelToForm()
		this.form.controls.idOfRelationship.valueChanges.subscribe(relationshipId =>
			this.form.controls.nameOfPerson.setValue(this.relationships()?.find(({ _id }) => _id === relationshipId)?.fullName!)
		)
	}

	private initEditInteraction(): void {
		this.form = this.interactionMapper.mapModelToForm(this.data.interaction!)
	}

	private loadRelationships(): void {
		this.api.getRelationshipsGroupedByStatus().subscribe({
			next: groupedRelationships => {
				const relationships = Object.values(groupedRelationships).flatMap(({ relationships }) => relationships)
				const sortedRels = this.relationshipsService.sortByFirstName(relationships)
				this.relationships.set(sortedRels)
			},
			error: error => this.snackBar.open(this.RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
		})
	}

	onCancelClick(): void {

	}

	onSaveClick(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return
		}
		let { payload, relationshipId } = this.interactionMapper.mapFormToPayload(this.form)
		if (!relationshipId) relationshipId = this.data.relationshipId!

		this.persistInteractionRemotely(payload, relationshipId)
	}

	private persistInteractionRemotely(newInteraction: InteractionPayload, relationshipId: string): void {
		if (this.data.isAddingInteraction) {
			this.api.addInteraction(newInteraction, relationshipId).subscribe({
				next: ({ insertedId }) => {
					this.form.controls._id.setValue(insertedId)
					this.dialogRef.close(this.form)
				},
				error: error => this.snackBar.open(this.SAVE_INTERACTION_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		} else if (this.data.isEditingInteraction) {
			this.api.updateInteraction(newInteraction, relationshipId).subscribe({
				next: () => this.dialogRef.close(this.form),
				error: error => this.snackBar.open(this.SAVE_INTERACTION_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		}
	}

	onAddTopicClick(): void {
		this.form.controls.topicsDiscussed.push(this.interactionMapper.mapTopicsModelToForm())
	}

	onRemoveTopicClick(index: number): void {
		const removedTopic = this.form.controls.topicsDiscussed.at(index)
		this.form.controls.topicsDiscussed.removeAt(index)
		const snackBarRef = this.snackBar.open('Topic removed', 'Undo', this.SNACKBAR_CONFIG)
		snackBarRef.onAction().subscribe(() => this.form.controls.topicsDiscussed.insert(index, removedTopic))
	}

}
