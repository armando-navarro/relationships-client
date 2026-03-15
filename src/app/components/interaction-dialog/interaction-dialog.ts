import { Component, inject, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { map, Observable, pairwise, startWith } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'

import { Api } from '../../services/api'
import { Cancelable } from '../../interfaces/misc-interface'
import { Card } from '../card/card'
import { ConfirmationDialog, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog'
import { Interaction, InteractionFormGroup, InteractionPayload } from '../../interfaces/interaction-interface'
import { InteractionMapper } from '../../services/mappers/interaction-mapper'
import { InteractionType } from '../../interfaces/interaction-interface'
import { MaterialConfig } from '../../services/material-config'
import { NewlinesToBrPipe } from '../../pipes/newlines-to-br-pipe'
import { PageHeaderBar } from '../page-header-bar/page-header-bar'
import { Relationship, UpdatedRelationshipProperties } from '../../interfaces/relationship-interface'
import { RelationshipUtilities } from '../../services/relationship-utilities'
import { TopicDialog, TopicDialogData } from '../topic-dialog/topic-dialog'
import { TopicFormToModelPipe } from '../../pipes/topic-form-to-model-pipe'
import { REQUIRED_ERROR } from '../../constants/misc-constants'

export interface InteractionDialogData {
	relationshipId: string|null
	relationshipName: string|null
	interaction: Interaction|null
	isAddingInteraction?: true
	isEditingInteraction?: true
	showRelationshipPicker?: true
}

export interface InteractionDialogSaveResult extends UpdatedRelationshipProperties {
	form: InteractionFormGroup
	interaction: Interaction
}

export type InteractionDialogResult = Cancelable<InteractionDialogSaveResult>

@Component({
	selector: 'app-interaction-dialog',
	imports: [
		Card, MatButtonModule, MatDatepickerModule, MatDialogContent,
		MatDialogActions, MatDialogClose, MatFormFieldModule, MatIconModule,
		MatInputModule, NewlinesToBrPipe, PageHeaderBar, ReactiveFormsModule,
		TopicFormToModelPipe
	],
	templateUrl: './interaction-dialog.html',
	styleUrl: './interaction-dialog.scss'
})
export class InteractionDialog implements OnInit {
	private readonly api = inject(Api)
	protected readonly data = inject<InteractionDialogData>(MAT_DIALOG_DATA)
	private readonly dialog = inject(MatDialog)
	private readonly dialogRef: MatDialogRef<InteractionDialog, InteractionDialogResult> = inject(MatDialogRef)
	private readonly interactionMapper = inject(InteractionMapper)
	private readonly materialConfig = inject(MaterialConfig)
	private readonly relationshipUtils = inject(RelationshipUtilities)
	private readonly snackBar = inject(MatSnackBar)

	protected form = this.interactionMapper.mapModelToForm()
	protected readonly relationships = signal<Relationship[]|undefined>(undefined)
	protected readonly pageHeading = signal('')
	protected readonly wasInteractionModified = signal(false)
	protected readonly typeOptions = InteractionType
	protected readonly dateMax = new Date()

	private readonly RELATIONSHIP_ERROR = 'Failed to load relationships. Try again later.'
	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_INTERACTION_ERROR = 'Failed to save interaction. Please try again.'

	ngOnInit(): void {
		if (this.data.showRelationshipPicker) this.loadRelationships()
		this.pageHeading.set(this.data.isAddingInteraction ? 'Add Interaction' : 'Edit Interaction')
		this.initForm()
		this.markInteractionModifiedWhenFormChanges()
	}

	/** Build the form for either a new interaction or the interaction being edited. */
	private initForm(): void {
		if (this.data.isAddingInteraction) {
			this.form = this.interactionMapper.mapModelToForm(undefined, this.data.relationshipId ?? undefined, this.data.relationshipName ?? undefined)
			this.syncRelationshipNameWithSelectedRelationship()
		} else {
			this.form = this.interactionMapper.mapModelToForm(this.data.interaction!)
		}
	}

	/** Keeps track of changes to the selected relationship and updates the name of the person on the `Interaction` object accordingly. */
	private syncRelationshipNameWithSelectedRelationship(): void {
		this.form.controls.idOfRelationship.valueChanges.subscribe(relationshipId =>
			this.form.controls.nameOfPerson.setValue(this.relationships()?.find(({ _id }) => _id === relationshipId)?.fullName!)
		)
	}

	/** Load relationships for the relationship picker and sort them alphabetically. */
	private loadRelationships(): void {
		this.api.getRelationshipsGroupedByStatus().subscribe({
			next: groupedRelationships => {
				const relationships = Object.values(groupedRelationships).flatMap(({ relationships }) => relationships)
				const sortedRels = this.relationshipUtils.sortByFirstName(relationships)
				this.relationships.set(sortedRels)
			},
			error: error => this.snackBar.open(this.RELATIONSHIP_ERROR, undefined)
		})
	}

	/** Mark the interaction as modified when relevant form fields change. */
	private markInteractionModifiedWhenFormChanges(): void {
		this.form.valueChanges.pipe(
			startWith(this.form.value),
			pairwise(),
		).subscribe(([ previous, current ]) => {
			if (
				previous._id !== current._id ||
				previous.type !== current.type ||
				previous.date?.valueOf() !== current.date?.valueOf() ||
				previous.topics !==  current.topics
			) {
				this.wasInteractionModified.set(true)
			}
		})
	}

	/** Open the add-topic flow for the current interaction form. */
	protected addTopic(): void {
		const data: TopicDialogData = { interactionForm: this.form }
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(TopicDialog, config)
	}

	/** Open the edit-topic flow for the selected topic index. */
	protected editTopic(index: number): void {
		const data: TopicDialogData = { interactionForm: this.form, editTopicIndex: index }
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(TopicDialog, config)
	}

	/** Confirm topic deletion and allow the user to undo it from the snackbar. */
	protected deleteTopic(topicName: string, index: number): void {
		const data: ConfirmationDialogData = {
			dialogText: `Are you sure you want to delete the topic: ${topicName}?`
		}
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(ConfirmationDialog, config).afterClosed().subscribe(confirmed => {
			if (!confirmed) return

			const deletedTopic = this.form.controls.topics.at(index)
			this.form.controls.topics.removeAt(index)
			const snackBarRef = this.snackBar.open('Topic removed', 'Undo')
			snackBarRef.onAction().subscribe(() => this.form.controls.topics.insert(index, deletedTopic))
		})
	}

	/** Validate the form, persist the interaction, and close the add/edit flow with the saved result. */
	protected saveInteraction(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined)
			return
		}
		const { payload, relationshipId } = this.interactionMapper.mapFormToPayloadWithRelationshipId(this.form)
		const saveInteraction$ = this.data.isAddingInteraction
			? this.saveNewInteraction(payload, relationshipId!)
			: this.saveEditedInteraction(payload, relationshipId!)

		saveInteraction$.subscribe({
			next: saveResult => this.dialogRef.close({
				wasCancelled: false,
				...saveResult
			}),
			error: error => this.snackBar.open(this.SAVE_INTERACTION_ERROR, undefined)
		})
	}

	/** Persist a new interaction and return the saved form, model, and derived relationship properties. */
	private saveNewInteraction(payload: InteractionPayload, relationshipId: string): Observable<InteractionDialogSaveResult> {
		return this.api.addInteraction(payload, relationshipId!).pipe(
			map(({ insertedId, updatedRelationshipProperties }) => {
				this.form.controls._id.setValue(insertedId)
				return {
					form: this.form,
					interaction: this.interactionMapper.mapFormToModel(this.form),
					updatedRelationshipProperties,
				}
			}),
		)
	}

	/** Persist edits to an existing interaction and return the form, model, and derived relationship properties. */
	private saveEditedInteraction(payload: InteractionPayload, relationshipId: string): Observable<InteractionDialogSaveResult> {
		return this.api.updateInteraction(payload, relationshipId!).pipe(
			map(updatedRelationshipProperties => ({
				form: this.form,
				interaction: this.interactionMapper.mapFormToModel(this.form),
				updatedRelationshipProperties,
			}))
		)
	}

}
