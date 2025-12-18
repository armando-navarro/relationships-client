import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { DatePipe } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { pairwise, startWith, Subject, takeUntil } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'

import { CardComponent } from '../../components/card/card.component'
import { EditInteractionComponent, InteractionDialogSaveResult } from '../edit-interaction/edit-interaction.component'
import { Interaction } from "../../interfaces/interaction.interface"
import { InteractionCardContentComponent } from '../../components/interaction-card-content/interaction-card-content.component'
import { InteractionMapperService } from '../../services/mappers/interaction.mapper.service'
import { InteractionRate, Relationship, RelationshipFormGroup } from "../../interfaces/relationship.interface"
import { InteractionsService } from '../../services/interactions.service'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { RelationshipFormService } from '../../services/relationship-form.service'
import { RelationshipMapperService } from '../../services/mappers/relationship.mapper.service'
import { REQUIRED_ERROR, SNACKBAR_CONFIG } from '../../constants/misc-constants'

export interface RelationshipDialogData {
	relationship: Relationship|null
	isAddingRelationship?: boolean
	isEditingRelationship?: true
}

@Component({
	selector: 'app-edit-relationship',
	standalone: true,
	imports: [
		CardComponent, DatePipe, InteractionCardContentComponent, MatButtonModule, MatDialogActions,
		MatDialogClose, MatDialogContent, MatIconModule, MatFormFieldModule, MatInputModule,
		PageHeaderBarComponent, ReactiveFormsModule
	],
	providers: [RelationshipFormService],
	templateUrl: './edit-relationship.component.html',
	styleUrl: './edit-relationship.component.scss'
})
export class EditRelationshipComponent implements OnInit, OnDestroy {
	private readonly data = inject<RelationshipDialogData>(MAT_DIALOG_DATA)
	private readonly dialog = inject(MatDialog)
	private readonly dialogRef = inject(MatDialogRef)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly relationshipFormService = inject(RelationshipFormService)
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
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG

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
		this.form = this.relationshipFormService.initForm()
	}

	private initEditRelationship(): void {
		this.form = this.relationshipFormService.initForm(this.data.relationship!)
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
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return
		}
		const data = await this.relationshipFormService.getAddInteractionData()
		this.dialog.open(EditInteractionComponent, { data, disableClose: true }).afterClosed().subscribe((dataOrCancel: InteractionDialogSaveResult|false) => {
			if (!dataOrCancel) return
			this.relationshipFormService.processAddInteractionResult(dataOrCancel)
		})
	}

	onEditInteractionClick(editTarget: Interaction): void {
		const data = this.relationshipFormService.getEditInteractionData(editTarget)
		this.dialog.open(EditInteractionComponent, { data, disableClose: true }).afterClosed().subscribe((dataOrCancel: InteractionDialogSaveResult|false) => {
			if (!dataOrCancel) return
			this.relationshipFormService.processEditInteractionResult(dataOrCancel)
		})
	}

	onDeleteInteractionClick(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(
			deleteTarget,
			this.data.relationship!._id!,
			this.form.controls.firstName.value!
		).subscribe(updatedPropertiesOrCancel => {
			if (typeof updatedPropertiesOrCancel === 'boolean') return
			this.relationshipFormService.proccessDeleteInteractionResult(deleteTarget, updatedPropertiesOrCancel)
		})
	}

	onSaveClick(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return
		}
		this.relationshipFormService.saveRelationship().subscribe({
			next: () => this.onDoneClick(),
			error: error => this.snackBar.open(this.SAVE_RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
		})
	}

	onDoneClick(): void {
		this.dialogRef.close(this.relationshipFormService.getRelationship())
	}

	ngOnDestroy(): void {
		this.destroy$.next()
	}

}
