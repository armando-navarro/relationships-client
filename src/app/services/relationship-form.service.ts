import { inject, Injectable, OnDestroy } from '@angular/core'
import { map, Observable, Subscription, tap } from 'rxjs'

import { ApiService } from './api.service'
import { Interaction } from '../interfaces/interaction.interface'
import { InteractionDialogSaveResult } from '../components/interaction-dialog/interaction-dialog.component'
import { InteractionUtilitiesService } from './interaction-utilities.service'
import { RelationshipDerivedProperties, Relationship, RelationshipFormGroup, RelationshipPayload } from '../interfaces/relationship.interface'
import { RelationshipMapperService } from './mappers/relationship.mapper.service'

export interface RelationshipSaveResult {
	wasNameModified: boolean
	wereInteractionsModified: boolean
}

@Injectable()
export class RelationshipFormService implements OnDestroy {
	private readonly api = inject(ApiService)
	private readonly interactionUtils = inject(InteractionUtilitiesService)
	private readonly relationshipMapper = inject(RelationshipMapperService)

	// TODO: CONVERT TO SIGNALS WHAT IS USEFUL AS SIGNALS
	private relationshipForm?: RelationshipFormGroup
	private modifiedRelationship = {} as Relationship
	private originalRelationship?: Relationship
	private _wasRelationshipModified = false
	get wasRelationshipModified(): boolean { return this._wasRelationshipModified }
	private isExistingRelationship = false
	private _wereInteractionsModified = false
	get wereInteractionsModified(): boolean { return this._wereInteractionsModified }
	get wasNameModified(): boolean {
		return this.originalRelationship?.firstName !== this.modifiedRelationship.firstName
			|| this.originalRelationship?.lastName !== this.modifiedRelationship.lastName
	}
	private formChangesSub?: Subscription

	initForm(relationship?: Relationship): RelationshipFormGroup {
		this.isExistingRelationship = !!relationship
		this.relationshipForm = this.relationshipMapper.mapModelToForm(relationship)

		if (relationship) this.originalRelationship = { ...relationship }
		else relationship = { interactions: [] as Interaction[] } as Relationship

		this.modifiedRelationship = { ...relationship }

		// keep the modifiedRelationship model up to date with form changes
		this.formChangesSub = this.relationshipForm.valueChanges.subscribe(newValue => {
			this._wasRelationshipModified = true
			this.modifiedRelationship = {
				...this.modifiedRelationship,
				firstName: newValue.firstName!,
				lastName: newValue.lastName!,
				fullName: `${newValue.firstName} ${newValue.lastName ?? ''}`.trim(),
				interactionRateGoal: newValue.interactionRateGoal!,
				notes: newValue.notes!
			}
		})
		return this.relationshipForm
	}

	/** Takes the result from the add interaction flow and updates the relationship form and model accordingly */
	processAddInteractionDialogResult({ form, interaction, updatedRelationshipProperties }: InteractionDialogSaveResult): void {
		this._wereInteractionsModified = true

		// add new interaction to relationship form
		this.interactionUtils.insertInteractionInOrder(this.relationshipForm!.controls.interactions, form)

		// add new interaction to relationship model
		const updatedInteractions = this.interactionUtils.insertInteractionInOrder(this.modifiedRelationship.interactions, interaction)

		// create a new relationship model with the new changes, including derived properties
		this.modifiedRelationship = {
			...this.modifiedRelationship,
			...updatedRelationshipProperties,
			interactions: updatedInteractions
		}
	}

	/** Takes the result from the edit interaction flow and updates the relationship form and model accordingly */
	processEditInteractionResult({ form, interaction, updatedRelationshipProperties }: InteractionDialogSaveResult): void {
		this._wereInteractionsModified = true

		// update relationship form with modified interaction
		const targetIndex = this.relationshipForm!.controls.interactions.controls.findIndex(({ value }) => value._id === form.value._id)
		this.relationshipForm!.controls.interactions.setControl(targetIndex, form)

		// update relationship model's interactions with modified interaction
		const updatedInteractions = [ ...this.modifiedRelationship?.interactions ]
		updatedInteractions[targetIndex] = interaction

		// update the relationship model with new changes, including derived properties
		this.modifiedRelationship = {
			...this.modifiedRelationship,
			...updatedRelationshipProperties,
			interactions: updatedInteractions
		}
	}


	/** Takes the result from the delete interaction flow and updates the relationship form and model accordingly */
	processDeleteInteractionResult(deleteTarget: Interaction, updatedRelationshipProperties: RelationshipDerivedProperties): void {
		this._wereInteractionsModified = true

		// remove interaction from the relationship form
		const interactionsFormArray = this.relationshipForm!.controls.interactions
		const deleteIndex = interactionsFormArray.controls.findIndex(control => control.value._id === deleteTarget._id)
		if (deleteIndex !== -1) interactionsFormArray.removeAt(deleteIndex)

		const updatedInteractions = [ ...this.modifiedRelationship.interactions ]
		updatedInteractions.splice(deleteIndex, 1)

		// remove interaction from the Relationship model
		this.modifiedRelationship = {
			...this.modifiedRelationship,
			...updatedRelationshipProperties,
			interactions: updatedInteractions,
		}
	}

	/** Persist the relationship form data on the backend. */
	saveRelationship(): Observable<RelationshipSaveResult> {
		const payload = this.relationshipMapper.mapFormToPayload(this.relationshipForm!)
		const relationshipPersisted$ = this.isExistingRelationship
			? this.updatePersistedRelationship(payload)
			: this.persistNewRelationship(payload)

		return relationshipPersisted$.pipe(
			map(() => ({
				relationship: this.modifiedRelationship,
				wasNameModified: this.wasNameModified,
				wereInteractionsModified: this.wereInteractionsModified
			}))
		)
	}

	/** Update a relationship that already exists in the database. */
	private updatePersistedRelationship(payload: RelationshipPayload): Observable<void> {
		return this.api.updateRelationship(payload).pipe(
			tap(({ updatedRelationshipProperties }) => {
				const partialRelationship = this.relationshipMapper.mapPartialResponseToModel((updatedRelationshipProperties))
				this.modifiedRelationship = { ...this.modifiedRelationship, ...partialRelationship }
			}),
			map(() => {})
		)
	}

	/** Persist a new relationship. */
	private persistNewRelationship(payload: RelationshipPayload): Observable<void> {
		return this.api.addRelationship(payload).pipe(
			tap(({ insertedId, attentionNeededStatus }) => {
				this.relationshipForm!.controls._id.setValue(insertedId)
				this.modifiedRelationship = { ...this.modifiedRelationship, _id: insertedId, attentionNeededStatus }
				this.isExistingRelationship = true
			}),
			map(() => {})
		)
	}

	getRelationship(): Relationship {
		return this.modifiedRelationship
	}

	ngOnDestroy(): void {
		this.formChangesSub?.unsubscribe()

	}

}
