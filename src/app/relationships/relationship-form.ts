import { computed, inject, Injectable, signal } from '@angular/core'
import { map, Observable, tap } from 'rxjs'

import { Api } from '../shared/api'
import { Interaction } from '../interactions/interaction-interface'
import { InteractionDialogSaveResult } from '../interactions/interaction-dialog/interaction-dialog'
import { InteractionUtilities } from '../interactions/interaction-utilities'
import { RelationshipDerivedProperties, Relationship, RelationshipFormGroup, RelationshipPayload } from './relationship-interface'
import { RelationshipMapper } from './relationship-mapper'

@Injectable()
export class RelationshipForm {
	private readonly api = inject(Api)
	private readonly interactionUtils = inject(InteractionUtilities)
	private readonly relationshipMapper = inject(RelationshipMapper)

	private relationshipForm?: RelationshipFormGroup
	private readonly originalRelationship = signal<Relationship | undefined>(undefined)

	private readonly _modifiedRelationship = signal<Relationship>({} as Relationship)
	readonly modifiedRelationship = this._modifiedRelationship.asReadonly()

	private readonly _modifiedInteractions = signal<Interaction[]>([])
	readonly modifiedInteractions = this._modifiedInteractions.asReadonly()

	private readonly _deletedInteractions = signal<Interaction[]>([])
	readonly deletedInteractions = this._deletedInteractions.asReadonly()

	private readonly _wasRelationshipModified = signal(false)
	readonly wasRelationshipModified = this._wasRelationshipModified.asReadonly()

	readonly wereInteractionsModified = computed(() =>
		!!(this._modifiedInteractions().length || this._deletedInteractions().length)
)

	private readonly isExistingRelationship = signal(false)

	readonly wasNameModified = computed(() =>
		this.originalRelationship()?.firstName !== this._modifiedRelationship().firstName
			|| this.originalRelationship()?.lastName !== this._modifiedRelationship().lastName
	)

	/** Initialize and begin tracking a relationship form for the add or edit flow. */
	initForm(relationship?: Relationship): RelationshipFormGroup {
		this.isExistingRelationship.set(!!relationship)
		this.relationshipForm = this.relationshipMapper.mapModelToForm(relationship)

		if (relationship) this.originalRelationship.set({ ...relationship })
		else relationship = { interactions: [] as Interaction[] } as Relationship

		this._modifiedRelationship.set({ ...relationship })

		// keep the modifiedRelationship model up to date with form changes
		this.relationshipForm.valueChanges.subscribe(newValue => {
			this._wasRelationshipModified.set(true)
			this._modifiedRelationship.update(current => ({
				...current,
				firstName: newValue.firstName!,
				lastName: newValue.lastName!,
				fullName: `${newValue.firstName} ${newValue.lastName ?? ''}`.trim(),
				interactionRateGoal: newValue.interactionRateGoal!,
				notes: newValue.notes!
			}))
		})
		return this.relationshipForm
	}

	/** Takes the result from the add interaction flow and updates the relationship form and model accordingly */
	processAddInteractionDialogResult({ form, interaction, updatedRelationshipProperties }: InteractionDialogSaveResult): void {
		this._modifiedInteractions.update(current => [...current, interaction])

		// add new interaction to relationship form
		this.interactionUtils.insertInteractionInOrder(this.relationshipForm!.controls.interactions, form)

		// add new interaction to relationship model
		const updatedInteractions = this.interactionUtils.insertInteractionInOrder(this._modifiedRelationship().interactions, interaction)

		// create a new relationship model with the new changes, including derived properties
		this._modifiedRelationship.update(current => ({
			...current,
			...updatedRelationshipProperties,
			interactions: updatedInteractions
		}))
	}

	/** Takes the result from the edit interaction flow and updates the relationship form and model accordingly */
	processEditInteractionResult({ form, interaction, updatedRelationshipProperties }: InteractionDialogSaveResult): void {
		this._modifiedInteractions.update(current => [...current, interaction])

		// update relationship form with modified interaction
		const targetIndex = this.relationshipForm!.controls.interactions.controls.findIndex(({ value }) => value._id === form.value._id)
		this.relationshipForm!.controls.interactions.setControl(targetIndex, form)

		// update relationship model's interactions with modified interaction
		const updatedInteractions = [ ...this._modifiedRelationship().interactions ]
		updatedInteractions[targetIndex] = interaction

		// update the relationship model with new changes, including derived properties
		this._modifiedRelationship.update(current => ({
			...current,
			...updatedRelationshipProperties,
			interactions: updatedInteractions
		}))
	}


	/** Takes the result from the delete interaction flow and updates the relationship form and model accordingly */
	processDeleteInteractionResult(deleteTarget: Interaction, updatedRelationshipProperties: RelationshipDerivedProperties): void {
		this._deletedInteractions.update(current => [...current, deleteTarget])

		// remove interaction from the relationship form
		const interactionsFormArray = this.relationshipForm!.controls.interactions
		const deleteIndex = interactionsFormArray.controls.findIndex(control => control.value._id === deleteTarget._id)
		if (deleteIndex !== -1) interactionsFormArray.removeAt(deleteIndex)

		const updatedInteractions = [ ...this._modifiedRelationship().interactions ]
		updatedInteractions.splice(deleteIndex, 1)

		// remove interaction from the Relationship model
		this._modifiedRelationship.update(current => ({
			...current,
			...updatedRelationshipProperties,
			interactions: updatedInteractions,
		}))
	}

	/** Persist the relationship form data on the backend. */
	saveRelationship(): Observable<void> {
		const payload = this.relationshipMapper.mapFormToPayload(this.relationshipForm!)
		const relationshipPersisted$ = this.isExistingRelationship()
			? this.updatePersistedRelationship(payload)
			: this.persistNewRelationship(payload)
		return relationshipPersisted$.pipe(map(() => {}))
	}

	/** Update a relationship that already exists in the database. */
	private updatePersistedRelationship(payload: RelationshipPayload): Observable<void> {
		return this.api.updateRelationship(payload).pipe(
			tap(({ updatedRelationshipProperties }) => {
				const partialRelationship = this.relationshipMapper.mapPartialResponseToModel((updatedRelationshipProperties))
				this._modifiedRelationship.update(current => ({ ...current, ...partialRelationship }))
			}),
			map(() => {})
		)
	}

	/** Persist a new relationship. */
	private persistNewRelationship(payload: RelationshipPayload): Observable<void> {
		return this.api.addRelationship(payload).pipe(
			tap(({ insertedId, attentionNeededStatus }) => {
				this.relationshipForm!.controls._id.setValue(insertedId)
				this._modifiedRelationship.update(current => ({ ...current, _id: insertedId, attentionNeededStatus }))
				this.isExistingRelationship.set(true)
			}),
			map(() => {})
		)
	}

}
