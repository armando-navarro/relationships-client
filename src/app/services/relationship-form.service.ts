import { inject, Injectable, OnDestroy } from '@angular/core'
import { lastValueFrom, map, Observable, Subscription, tap } from 'rxjs'

import { ApiService } from './api.service'
import { Interaction } from '../interfaces/interaction.interface'
import { InteractionDialogData, InteractionDialogSaveResult } from '../components/interaction-dialog/interaction-dialog.component'
import { InteractionMapperService } from './mappers/interaction.mapper.service'
import { InteractionsService } from './interactions.service'
import { RelationshipDerivedProperties, Relationship, RelationshipFormGroup } from '../interfaces/relationship.interface'
import { RelationshipMapperService } from './mappers/relationship.mapper.service'

@Injectable()
export class RelationshipFormService implements OnDestroy {
	private readonly api = inject(ApiService)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly relationshipMapper = inject(RelationshipMapperService)

	private relationshipForm?: RelationshipFormGroup
	private modifiedRelationship = {} as Relationship
	private wasRelationshipModified = false
	private wasRelationshipPersisted = false
	private formChangesSub?: Subscription

	initForm(relationship?: Relationship): RelationshipFormGroup {
		this.wasRelationshipPersisted = !!relationship
		this.relationshipForm = this.relationshipMapper.mapModelToForm(relationship)

		if (!relationship) relationship = { interactions: [] as Interaction[] } as Relationship

		this.modifiedRelationship = { ...relationship }
		this.formChangesSub = this.relationshipForm.valueChanges.subscribe(newValue => {
			this.wasRelationshipModified = true
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

	async getAddInteractionData(): Promise<InteractionDialogData> {
		if (this.wasRelationshipModified) await lastValueFrom(this.saveRelationship())
		return {
			relationshipId: this.modifiedRelationship._id ?? null,
			relationshipName: this.modifiedRelationship.fullName ?? null,
			interaction: null,
			isAddingInteraction: true,
		}
	}

	processAddInteractionResult({ form: newInteractionForm, updatedRelationshipProperties }: InteractionDialogSaveResult): void {
		// add new interaction to relationship form
		this.interactionsService.insertInteractionInOrder(
			this.relationshipForm!.controls.interactions,
			newInteractionForm
		)
		// add new interaction to relationship model
		const updatedInteractions = this.interactionsService.insertInteractionInOrder(
			this.modifiedRelationship.interactions,
			this.interactionMapper.mapFormToModel(newInteractionForm)
		)
		// create a new relationship model with the new changes, including derived properties
		this.modifiedRelationship = {
			...this.modifiedRelationship,
			...updatedRelationshipProperties,
			interactions: updatedInteractions
		}
	}

	getEditInteractionData(editTarget: Interaction): InteractionDialogData {
		return {
			relationshipId: this.modifiedRelationship._id ?? null,
			relationshipName: this.modifiedRelationship.fullName ?? null,
			interaction: editTarget,
			isEditingInteraction: true,
		}
	}

	processEditInteractionResult({ form: newInteractionForm, updatedRelationshipProperties }: InteractionDialogSaveResult): void {
		// update relationship form with modified interaction
		const targetIndex = this.relationshipForm!.controls.interactions.controls.findIndex(({ value }) => value._id === newInteractionForm.value._id)
		this.relationshipForm!.controls.interactions.setControl(targetIndex, newInteractionForm)
		// update relationship model's interactions with modified interaction
		const updatedInteractions = [ ...this.modifiedRelationship?.interactions ]
		updatedInteractions[targetIndex] = this.interactionMapper.mapFormToModel(newInteractionForm)
		// create a new relationship model with new changes, including derived properties
		this.modifiedRelationship = {
			...this.modifiedRelationship,
			...updatedRelationshipProperties,
			interactions: updatedInteractions
		}
	}

	proccessDeleteInteractionResult(deleteTarget: Interaction, updatedRelationshipProperties: RelationshipDerivedProperties): void {
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

	saveRelationship(): Observable<void> {
		const payload = this.relationshipMapper.mapFormToPayload(this.relationshipForm!)
		if (this.wasRelationshipPersisted) {
			return this.api.updateRelationship(payload).pipe(
				tap(({ updatedRelationshipProperties }) => {
					const partialRelationship = this.relationshipMapper.mapPartialResponseToModel((updatedRelationshipProperties))
					this.modifiedRelationship = {
						...this.modifiedRelationship,
						...partialRelationship,
					}
				}),
				map(() => {})
			)
		} else {
			return this.api.addRelationship(payload).pipe(
				tap(({ insertedId, attentionNeededStatus }) => {
					this.relationshipForm!.controls._id.setValue(insertedId)
					this.modifiedRelationship = {
						...this.modifiedRelationship,
						_id: insertedId,
						attentionNeededStatus
					}
					this.wasRelationshipPersisted = true
				}),
				map(() => {})
			)
		}
	}

	getRelationship(): Relationship {
		return this.modifiedRelationship
	}

	ngOnDestroy(): void {
		this.formChangesSub?.unsubscribe()

	}

}
