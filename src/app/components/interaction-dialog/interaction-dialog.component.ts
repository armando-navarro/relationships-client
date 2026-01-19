import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { map, Observable, pairwise, startWith, Subject, takeUntil } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from "@angular/material/input"
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../card/card.component'
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component'
import { Interaction, InteractionFormGroup, InteractionPayload } from "../../interfaces/interaction.interface"
import { InteractionMapperService } from '../../services/mappers/interaction.mapper.service'
import { InteractionType } from "../../interfaces/interaction.interface"
import { MaterialConfigService } from '../../services/material-config.service'
import { NewlinesToBrPipe } from "../../pipes/newlines-to-br.pipe"
import { PageHeaderBarComponent } from '../page-header-bar/page-header-bar.component'
import { Relationship, UpdatedRelationshipProperties } from '../../interfaces/relationship.interface'
import { RelationshipsService } from '../../services/relationships.service'
import { TopicDialogComponent, TopicDialogData } from '../topic-dialog/topic-dialog.component'
import { TopicFormToModelPipe } from "../../pipes/topic-form-to-model.pipe"
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
	form: InteractionFormGroup,
}

@Component({
	selector: 'app-interaction-dialog',
	standalone: true,
	imports: [
    CardComponent, MatButtonModule, MatDatepickerModule, MatDialogContent,
    MatDialogActions, MatDialogClose, MatFormFieldModule, MatIconModule,
    MatInputModule, NewlinesToBrPipe, PageHeaderBarComponent, ReactiveFormsModule,
    TopicFormToModelPipe
],
	templateUrl: './interaction-dialog.component.html',
	styleUrl: './interaction-dialog.component.scss'
})

export class InteractionDialogComponent implements OnInit, OnDestroy {
	private readonly api = inject(ApiService)
	readonly data = inject<InteractionDialogData>(MAT_DIALOG_DATA)
	private readonly dialog = inject(MatDialog)
	private readonly dialogRef = inject(MatDialogRef)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly materialConfig = inject(MaterialConfigService)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly snackBar = inject(MatSnackBar)

	form = this.interactionMapper.mapModelToForm()
	readonly relationships = signal<Relationship[]|undefined>(undefined)
	readonly pageHeading = signal('')
	readonly wasInteractionModified = signal(false)
	readonly typeOptions = InteractionType
	readonly dateMax = new Date()
	private readonly destroy$ = new Subject<void>()

	private readonly RELATIONSHIP_ERROR = 'Failed to load relationships. Try again later.'
	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_INTERACTION_ERROR = 'Failed to save interaction. Please try again.'

	ngOnInit(): void {
		if (this.data.showRelationshipPicker) this.loadRelationships()

		if (this.data.isAddingInteraction) this.initAddInteraction()
		else if (this.data.isEditingInteraction) this.initEditInteraction()

		// keep track of unsaved edits so the correct buttons are displayed
		this.trackFormSavedState()

		this.pageHeading.set(this.data.isAddingInteraction ? 'Add Interaction' : 'Edit Interaction')
	}

	private initAddInteraction(): void {
		this.form = this.interactionMapper.mapModelToForm(undefined, this.data.relationshipId ?? undefined, this.data.relationshipName ?? undefined)
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
			error: error => this.snackBar.open(this.RELATIONSHIP_ERROR, undefined)
		})
	}

	private trackFormSavedState(): void {
		this.form.valueChanges.pipe(
			takeUntil(this.destroy$),
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

	onAddTopicClick(): void {
		const data: TopicDialogData = { interactionForm: this.form }
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(TopicDialogComponent, config)
	}

	onEditTopicClick(index: number): void {
		const data: TopicDialogData = { interactionForm: this.form, editTopicIndex: index }
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(TopicDialogComponent, config)
	}

	onDeleteTopicClick(topicName: string, index: number): void {
		const data: ConfirmationDialogData = {
			dialogText: `Are you sure you want to delete the topic: ${topicName}?`
		}
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(ConfirmationDialogComponent, config).afterClosed().subscribe(confirmed => {
			if (!confirmed) return

			const deletedTopic = this.form.controls.topics.at(index)
			this.form.controls.topics.removeAt(index)
			const snackBarRef = this.snackBar.open('Topic removed', 'Undo')
			snackBarRef.onAction().subscribe(() => this.form.controls.topics.insert(index, deletedTopic))
		})
	}

	onSaveInteractionClick(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined)
			return
		}
		const { payload, relationshipId } = this.interactionMapper.mapFormToPayloadWithRelationshipId(this.form)
		const saveInteraction$ = this.data.isAddingInteraction
			? this.saveNewInteraction(payload, relationshipId!)
			: this.saveEditedInteraction(payload, relationshipId!)

		saveInteraction$.subscribe({
			next: saveResult => this.dialogRef.close(saveResult),
			error: error => this.snackBar.open(this.SAVE_INTERACTION_ERROR, undefined)
		})
	}

	private saveNewInteraction(payload: InteractionPayload, relationshipId: string): Observable<InteractionDialogSaveResult> {
		return this.api.addInteraction(payload, relationshipId!).pipe(
			map(({ insertedId, updatedRelationshipProperties }) => {
				this.form.controls._id.setValue(insertedId)
				return {
					form: this.form,
					updatedRelationshipProperties,
				}
			}),
		)
	}

	private saveEditedInteraction(payload: InteractionPayload, relationshipId: string): Observable<InteractionDialogSaveResult> {
		return this.api.updateInteraction(payload, relationshipId!).pipe(
			map(updatedRelationshipProperties => ({
				form: this.form,
				updatedRelationshipProperties,
			}))
		)
	}

	onOkayClick(): void {
		this.dialogRef.close(false)
	}

	ngOnDestroy(): void {
		this.destroy$.next()
	}

}
