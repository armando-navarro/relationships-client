import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { pairwise, startWith, Subject, takeUntil } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'

import { Cancelable } from '../../interfaces/misc.interface'
import { CardComponent } from '../card/card.component'
import { Interaction } from "../../interfaces/interaction.interface"
import { InteractionCardContentComponent } from '../interaction-card-content/interaction-card-content.component'
import { InteractionMapperService } from '../../services/mappers/interaction.mapper.service'
import { InteractionRate, Relationship } from "../../interfaces/relationship.interface"
import { InteractionsService } from '../../services/interactions.service'
import { PageHeaderBarComponent } from '../page-header-bar/page-header-bar.component'
import { RelationshipFormService } from '../../services/relationship-form.service'
import { RelationshipMapperService } from '../../services/mappers/relationship.mapper.service'
import { REQUIRED_ERROR } from '../../constants/misc-constants'

export interface RelationshipDialogData {
	relationship: Relationship|null
	isAddingRelationship?: boolean
	isEditingRelationship?: true
}

export type RelationshipDialogResult = Cancelable<{
	relationship: Relationship
	wasNameModified: boolean
	wereInteractionsModified: boolean
}>

@Component({
	selector: 'app-relationship-dialog',
	standalone: true,
	imports: [
    CardComponent, InteractionCardContentComponent, MatButtonModule, MatDialogActions,
    MatDialogClose, MatDialogContent, MatIconModule, MatFormFieldModule, MatInputModule,
    PageHeaderBarComponent, ReactiveFormsModule,
],
	providers: [RelationshipFormService],
	templateUrl: './relationship-dialog.component.html',
	styleUrl: './relationship-dialog.component.scss'
})
export class RelationshipDialogComponent implements OnInit, OnDestroy {
	private readonly data = inject<RelationshipDialogData>(MAT_DIALOG_DATA)
	private readonly dialogRef: MatDialogRef<RelationshipDialogComponent, RelationshipDialogResult> = inject(MatDialogRef)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly formService = inject(RelationshipFormService)
	private readonly relationshipMapper = inject(RelationshipMapperService)
	private readonly snackBar = inject(MatSnackBar)

	interactions: Interaction[] = []
	form = this.relationshipMapper.mapModelToForm()
	readonly pageHeading = signal('')
	readonly isFormSaved = signal(false)

	readonly InteractionRates = InteractionRate
	private readonly destroy$ = new Subject<void>()

	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_RELATIONSHIP_ERROR = 'Failed to save relationship. Please try again.'

	ngOnInit(): void {
		this.form.controls.interactions.clear()
		this.pageHeading.set(this.data.isAddingRelationship ? 'Add Relationship' : 'Edit Relationship')

		if (this.data.isAddingRelationship) this.initAddRelationship()
		else this.initEditRelationship()

		// keep track of unsaved edits so the correct buttons are displayed
		this.trackFormSavedState()

		// keep a model of interactions to pass to card components (in some scenarios, form values don't exist for card components to consume)
		this.form.controls.interactions.valueChanges.subscribe(interactions => {
			this.interactions = this.interactionMapper.mapFormValueToModel(interactions)
		})
	}

	private initAddRelationship(): void {
		this.form = this.formService.initForm()
	}

	private initEditRelationship(): void {
		this.form = this.formService.initForm(this.data.relationship!)
		this.interactions = this.data.relationship!.interactions
		this.isFormSaved.set(true)
	}

	private trackFormSavedState(): void {
		this.form.valueChanges.pipe(
			takeUntil(this.destroy$),
			startWith(this.form.value),
			pairwise(),
		).subscribe(([ previous, current ]) => {
			// ignore changes to interactions because those are saved in the interactions dialog
			if (
				previous._id !== current._id ||
				previous.firstName !== current.firstName ||
				previous.lastName !== current.lastName ||
				previous.interactionRateGoal !==  current.interactionRateGoal ||
				previous.notes !== current.notes
			) {
				this.isFormSaved.set(false)
			}
		})
	}

	async onAddInteractionClick(): Promise<void> {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined)
			return
		}
		const { wasCancelled, form, interaction, updatedRelationshipProperties } = await this.interactionsService.addInteraction(this.formService)
		if (wasCancelled) return

		// update relationship form and model with derived properties returned from the API
		this.formService.processAddInteractionDialogResult({ form, interaction, updatedRelationshipProperties })
	}

	async onEditInteractionClick(editTarget: Interaction): Promise<void> {
		const { wasCancelled, form, interaction, updatedRelationshipProperties } = await this.interactionsService.editInteraction(editTarget, this.formService)
		if (wasCancelled) return

		// update the relationship form and model with the modified interaction and the derived properties returned from the API
		this.formService.processEditInteractionResult({ form, interaction, updatedRelationshipProperties })
	}

	onDeleteInteractionClick(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(deleteTarget, this.formService).subscribe()
	}

	onSaveClick(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined)
			return
		}
		this.formService.saveRelationship().subscribe({
			next: ({ wasNameModified, wereInteractionsModified }) => this.closeDialog(wasNameModified, wereInteractionsModified),
			error: error => this.snackBar.open(this.SAVE_RELATIONSHIP_ERROR, undefined)
		})
	}

	closeDialog(
		wasNameModified = this.formService.wasNameModified,
		wereInteractionsModified = this.formService.wereInteractionsModified
	): void {
		this.dialogRef.close({
			wasCancelled: false,
			relationship: this.formService.getRelationship(),
			wasNameModified,
			wereInteractionsModified,
		})
	}

	ngOnDestroy(): void {
		this.destroy$.next()
		this.destroy$.complete()
	}

}
