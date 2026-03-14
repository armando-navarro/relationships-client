import { Component, inject, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { pairwise, startWith } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'

import { Cancelable } from '../../interfaces/misc-interface'
import { Card } from '../card/card'
import { Interaction } from '../../interfaces/interaction-interface'
import { InteractionCardContent } from '../interaction-card-content/interaction-card-content'
import { InteractionMapper } from '../../services/mappers/interaction-mapper'
import { InteractionRate, Relationship } from '../../interfaces/relationship-interface'
import { Interactions } from '../../services/interactions'
import { PageHeaderBar } from '../page-header-bar/page-header-bar'
import { RelationshipForm } from '../../services/relationship-form'
import { RelationshipMapper } from '../../services/mappers/relationship-mapper'
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
	imports: [
		Card, InteractionCardContent, MatButtonModule, MatDialogActions,
		MatDialogClose, MatDialogContent, MatIconModule, MatFormFieldModule, MatInputModule,
		PageHeaderBar, ReactiveFormsModule,
	],
	providers: [RelationshipForm],
	templateUrl: './relationship-dialog.html',
	styleUrl: './relationship-dialog.scss'
})
export class RelationshipDialog implements OnInit {
	private readonly data = inject<RelationshipDialogData>(MAT_DIALOG_DATA)
	private readonly dialogRef: MatDialogRef<RelationshipDialog, RelationshipDialogResult> = inject(MatDialogRef)
	private readonly interactionMapper = inject(InteractionMapper)
	private readonly interactionsService = inject(Interactions)
	private readonly formService = inject(RelationshipForm)
	private readonly relationshipMapper = inject(RelationshipMapper)
	private readonly snackBar = inject(MatSnackBar)

	protected interactions: Interaction[] = []
	protected form = this.relationshipMapper.mapModelToForm()
	protected readonly pageHeading = signal('')
	protected readonly wasRelationshipModified = signal(false)

	protected readonly InteractionRates = InteractionRate

	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_RELATIONSHIP_ERROR = 'Failed to save relationship. Please try again.'

	ngOnInit(): void {
		this.pageHeading.set(this.data.isAddingRelationship ? 'Add Relationship' : 'Edit Relationship')
		this.initForm()
		this.markRelationshipModifiedWhenFormChanges()
		this.syncInteractionModelsWithFormValues()
	}

	private initForm(): void {
		if (this.data.isAddingRelationship) {
			this.form = this.formService.initForm()
			this.wasRelationshipModified.set(true)
		} else {
			this.form = this.formService.initForm(this.data.relationship!)
			this.interactions = this.data.relationship!.interactions
		}
	}

	/** Mark the relationship as modified when relevant form fields change. */
	private markRelationshipModifiedWhenFormChanges(): void {
		this.form.valueChanges.pipe(
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
				this.wasRelationshipModified.set(true)
			}
		})
	}

	/** Keep a model of interactions to pass to card components (in some scenarios, form values don't exist for card components to consume) */
	private syncInteractionModelsWithFormValues(): void {
		this.form.controls.interactions.valueChanges.subscribe(interactions => {
			this.interactions = this.interactionMapper.mapFormValueToModel(interactions)
		})
	}

	protected async addInteraction(): Promise<void> {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined)
			return
		}
		const { wasCancelled, form, interaction, updatedRelationshipProperties } = await this.interactionsService.addInteraction(this.formService)
		if (wasCancelled) return

		// update relationship form and model with derived properties returned from the API
		this.formService.processAddInteractionDialogResult({ form, interaction, updatedRelationshipProperties })
	}

	protected async editInteraction(editTarget: Interaction): Promise<void> {
		const { wasCancelled, form, interaction, updatedRelationshipProperties } = await this.interactionsService.editInteraction(editTarget, this.formService)
		if (wasCancelled) return

		// update the relationship form and model with the modified interaction and the derived properties returned from the API
		this.formService.processEditInteractionResult({ form, interaction, updatedRelationshipProperties })
	}

	protected deleteInteraction(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(deleteTarget, this.formService).subscribe()
	}

	protected saveRelationship(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined)
			return
		}
		this.formService.saveRelationship().subscribe({
			next: ({ wasNameModified, wereInteractionsModified }) => this.closeDialog(wasNameModified, wereInteractionsModified),
			error: error => this.snackBar.open(this.SAVE_RELATIONSHIP_ERROR, undefined)
		})
	}

	protected closeDialog(
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

}
