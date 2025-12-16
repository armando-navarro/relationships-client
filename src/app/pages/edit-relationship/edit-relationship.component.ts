import { Component, inject, model, OnInit, signal } from '@angular/core'
import { Location } from '@angular/common'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../../components/card/card.component'
import { EditInteractionComponent, InteractionDialogData } from '../edit-interaction/edit-interaction.component'
import { Interaction, InteractionFormGroup } from "../../interfaces/interaction.interface"
import { InteractionCardContentComponent } from '../../components/interaction-card-content/interaction-card-content.component'
import { InteractionMapperService } from '../../services/mappers/interaction.mapper.service'
import { InteractionRate } from "../../interfaces/relationship.interface"
import { InteractionsService } from '../../services/interactions.service'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { RelationshipsService } from '../../services/relationships.service'
import { REQUIRED_ERROR, SNACKBAR_CONFIG, TOPIC_HINT_VERBIAGE } from '../../constants/misc-constants'
import { RelationshipMapperService } from '../../services/mappers/relationship.mapper.service'

@Component({
	selector: 'app-edit-relationship',
	standalone: true,
	imports: [
		CardComponent, InteractionCardContentComponent, MatButtonModule,
		MatIconModule, MatFormFieldModule, MatInputModule, PageHeaderBarComponent, ReactiveFormsModule
	],
	templateUrl: './edit-relationship.component.html',
	styleUrl: './edit-relationship.component.scss'
})
export class EditRelationshipComponent implements OnInit {
	private readonly api = inject(ApiService)
	private readonly dialog = inject(MatDialog)
	private readonly fb = inject(FormBuilder)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly location = inject(Location)
	private readonly relationshipMapper = inject(RelationshipMapperService)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly route = inject(ActivatedRoute)
	private readonly router = inject(Router)
	private readonly snackBar = inject(MatSnackBar)

	readonly relationshipId = model<string>() // route parameter
	interactions: Interaction[] = []
	readonly isAddMode = signal(false)
	form = this.relationshipMapper.mapModelToForm()
	readonly InteractionRates = InteractionRate

	private readonly REQUIRED_ERROR = REQUIRED_ERROR
	private readonly SAVE_RELATIONSHIP_ERROR = 'Failed to save relationship. Please try again.'
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG
	readonly TOPIC_HINT_VERBIAGE = TOPIC_HINT_VERBIAGE

	ngOnInit(): void {
		this.form.controls.interactions.clear()

		this.isAddMode.set(!this.relationshipId())
		if (this.isAddMode()) {

		} else { // user is editing an existing relationship
			this.api.getRelationship(this.relationshipId()!).subscribe(relationship => {
				this.form.patchValue({
					firstName: relationship.firstName,
					lastName: relationship.lastName,
					interactionRateGoal: relationship.interactionRateGoal,
					notes: relationship.notes.replaceAll('<br />', '\n'),
				})
				this.form.controls.interactions.clear()
				relationship.interactions.forEach(interaction =>
					this.form.controls.interactions.push(this.interactionMapper.mapModelToForm(interaction))
				)
			})
		}

		// keep a model of interactions to pass to card components (in some scenarios, form values don't exist for card components to consume)
		this.form.controls.interactions.valueChanges.subscribe(interactions => {
			this.interactions = this.interactionMapper.mapFormValueToModel(interactions)
		})
	}

	onCancelClick(): void {
		this.interactionsService.interactionsForUnsavedRelationship.set([])
		this.location.back()
	}

	onSaveClick(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined, this.SNACKBAR_CONFIG)
			return
		}
		const relationship = this.relationshipMapper.mapFormToPayload(this.form)

		if (this.isAddMode()) {
			this.api.addRelationship(relationship).subscribe({
				next: () => {
					this.interactionsService.interactionsForUnsavedRelationship.set([])
					this.location.back()
				},
				error: error => this.snackBar.open(this.SAVE_RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		} else { // user is editing an existing relationship
			this.api.updateRelationship(relationship).subscribe({
				next: () => this.location.back(),
				error: error => this.snackBar.open(this.SAVE_RELATIONSHIP_ERROR, undefined, this.SNACKBAR_CONFIG)
			})
		}
	}

	onAddInteractionClick(): void {
		const data: InteractionDialogData = {
			relationshipId: this.relationshipId() ?? null,
			interactionId: null,
			interaction: null,
			isAddingInteraction: true,
		}
		this.dialog.open(EditInteractionComponent, { data }).afterClosed().subscribe((form: InteractionFormGroup) => {
			this.form.controls.interactions.insert(this.form.controls.interactions.length * -2, form)
		})
	}

	onEditInteractionClick(editTarget: Interaction): void {
		const data: InteractionDialogData = {
			relationshipId: this.relationshipId() ?? null,
			interactionId: editTarget._id,
			interaction: editTarget,
			isEditingInteraction: true,
		}
		this.dialog.open(EditInteractionComponent, { data }).afterClosed().subscribe((form: InteractionFormGroup) => {
			const targetIndex = this.form.controls.interactions.controls.findIndex(({ value }) => value._id === form.value._id)
			this.form.controls.interactions.setControl(targetIndex, form)
		})
	}

	onDeleteInteractionClick(deleteTarget: Interaction): void {
		const firstName = this.form.controls.firstName.value!
		const interactionsArray = this.form.controls.interactions

		this.interactionsService.deleteInteraction(deleteTarget, this.relationshipId()!, firstName).subscribe(targetDeleted => {
			if (targetDeleted) {
				const deleteIndex = interactionsArray.controls.findIndex(control => control.value._id === deleteTarget._id)
				if (deleteIndex !== -1) interactionsArray.removeAt(deleteIndex)
			}
		})
	}

}
