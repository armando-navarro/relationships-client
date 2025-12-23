import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
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
import { PageHeaderBarComponent } from '../page-header-bar/page-header-bar.component'
import { Relationship, UpdatedRelationshipProperties } from '../../interfaces/relationship.interface'
import { RelationshipsService } from '../../services/relationships.service'
import { REQUIRED_ERROR, SNACKBAR_CONFIG } from '../../constants/misc-constants'

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
		MatInputModule, PageHeaderBarComponent, ReactiveFormsModule,
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
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly snackBar = inject(MatSnackBar)
	private readonly topicNameInput = viewChild<ElementRef<HTMLInputElement>>('topicNameInput')

	form = this.interactionMapper.mapModelToForm()
	topicForm = this.interactionMapper.mapTopicModelToForm()
	readonly relationships = signal<Relationship[]|undefined>(undefined)
	readonly pageHeading = signal('')
	readonly wasInteractionModified = signal(false)
	readonly isAddTopicForm = signal(true)
	readonly isEditTopicForm = computed(() => !this.isAddTopicForm())
	private editTopicIndex: number|null = null
	readonly typeOptions = InteractionType
	private readonly destroy$ = new Subject<void>()

	private readonly RELATIONSHIP_ERROR = 'Failed to load relationships. Try again later.'
	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_INTERACTION_ERROR = 'Failed to save interaction. Please try again.'
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG

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
			error: error => this.snackBar.open(this.RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
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
				previous.topicsDiscussed !==  current.topicsDiscussed
			) {
				this.wasInteractionModified.set(true)
			}
		})
	}

	onCancelTopicClick(): void {
		this.topicForm = this.interactionMapper.mapTopicModelToForm()
		this.editTopicIndex = null
		this.isAddTopicForm.set(true)
	}

	onEditTopicClick(index: number): void {
		if (index === this.editTopicIndex) {
			this.topicNameInput()?.nativeElement.focus()
			return
		}

		if (this.hasUnsavedTopicChanges()) {
			const data: ConfirmationDialogData = {
				titleText: 'Unsaved Changes',
				dialogText: `You have unsaved changes that will be overwritten in topic: ${this.topicForm.value.topic?.trim()}.<br />Would you like to save it?`,
				noText: 'No, discard changes',
				yesText: 'Yes, save it',
			}
			this.dialog.open(ConfirmationDialogComponent, { data }).afterClosed().subscribe((userConfirmed: boolean) => {
				let okayToEdit = true
				if (userConfirmed) okayToEdit = this.onSaveTopicClick()
				if (okayToEdit) this.editTopic(index)
			})
		} else {
			this.editTopic(index)
		}
	}

	private hasUnsavedTopicChanges(): boolean {
		const { topic: formTopic, notes: formNotes } = this.topicForm.value
		if (this.isEditTopicForm()) {
			const { topic: originalTopic, notes: originalNotes } = this.form.controls.topicsDiscussed.at(this.editTopicIndex!).value
			return formTopic !== originalTopic || formNotes !== originalNotes
		} else {
			return !!(formTopic?.trim() || formNotes?.trim())
		}
	}

	private editTopic(index: number) {
		// create a copy of the target topic form
		const targetTopicForm = this.form.controls.topicsDiscussed.controls.at(index)
		const targetTopic = this.interactionMapper.mapTopicFormToModel(targetTopicForm!)
		this.topicForm = this.interactionMapper.mapTopicModelToForm(targetTopic)

		this.editTopicIndex = index
		this.isAddTopicForm.set(false)
		this.topicNameInput()?.nativeElement.focus()
	}

	onDeleteTopicClick(index: number): void {
		const deletedTopic = this.form.controls.topicsDiscussed.at(index)
		this.form.controls.topicsDiscussed.removeAt(index)
		const snackBarRef = this.snackBar.open('Topic removed', 'Undo', this.SNACKBAR_CONFIG)
		snackBarRef.onAction().subscribe(() => this.form.controls.topicsDiscussed.insert(index, deletedTopic))
	}

	/** @returns `true` if the topic was saved, or `false` otherwise. */
	onSaveTopicClick(): boolean {
		if (this.topicForm.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return false
		}
		if (this.isAddTopicForm()) this.form.controls.topicsDiscussed.push(this.topicForm)
		else /* isEditTopicForm */ {
			this.form.controls.topicsDiscussed.setControl(this.editTopicIndex!, this.topicForm)
			this.editTopicIndex = null
		}
		this.topicForm = this.interactionMapper.mapTopicModelToForm()
		this.isAddTopicForm.set(true)
		return true
	}

	onSaveInteractionClick(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return
		}
		const { payload, relationshipId } = this.interactionMapper.mapFormToPayloadWithRelationshipId(this.form)
		const saveInteraction$ = this.data.isAddingInteraction
			? this.saveNewInteraction(payload, relationshipId!)
			: this.saveEditedInteraction(payload, relationshipId!)

		saveInteraction$.subscribe({
			next: saveResult => this.dialogRef.close(saveResult),
			error: error => this.snackBar.open(this.SAVE_INTERACTION_ERROR, undefined, this.SNACKBAR_CONFIG)
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
