import { Injectable } from '@angular/core'
import { FormArray } from '@angular/forms'

import { Interaction, InteractionFormGroup } from './interaction-interface'
import { Relationship } from '../relationships/relationship-interface'

@Injectable({ providedIn: 'root' })
export class InteractionUtilities {

	/** Inserts an interaction into the proper spot in an array of interactions sorted descending by date. */
	insertInteractionInOrder(sortedInteractions: FormArray<InteractionFormGroup>, newInteraction: InteractionFormGroup): void
	insertInteractionInOrder(sortedInteractions: Interaction[], newInteraction: Interaction): Interaction[]
	insertInteractionInOrder(sortedInteractions: Interaction[]|FormArray<InteractionFormGroup>, newInteraction: Interaction|InteractionFormGroup): Interaction[]|void {
		if (sortedInteractions instanceof FormArray && 'controls' in newInteraction) {
			return this.insertInteractionFormInOrder(sortedInteractions, newInteraction)
		}
		if (!Array.isArray(sortedInteractions) || 'controls' in newInteraction) return

		let low = 0
		let high = sortedInteractions.length

		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			if (sortedInteractions[mid].date! > newInteraction.date!) low = mid + 1
			else high = mid
		}

		return [
			...sortedInteractions.slice(0, low),
			newInteraction,
			...sortedInteractions.slice(low)
		]
	}

	/** Insert an interaction form into a form array sorted in descending date order. */
	private insertInteractionFormInOrder(sortedInteractions: FormArray, newInteraction: InteractionFormGroup): void {
		let low = 0
		let high = sortedInteractions.length

		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			if (sortedInteractions.at(mid).value.date! > newInteraction.value.date!) low = mid + 1
			else high = mid
		}
		sortedInteractions.insert(low, newInteraction)
	}

	/** Refreshes the existing interactions list with modified and deleted interactions in descending date order and returns the updated list.
	 * It also renames the edited relationship's interactions' owner (`nameOfPerson`) when needed.
	 * @param modifiedInteractions The interactions that have been updated and need to be reinserted in the correct order.
	 * @param deletedInteractions The interactions that have been deleted and should be removed from the existing interactions.
	 * @param existingInteractions The current list of interactions before applying updates and deletions, sorted descending by date.
	 * @returns An updated sorted list of existing interactions with the deleted interactions removed and the updated interactions reinserted in the correct order. */
	updateInteractionsList(modifiedInteractions: Interaction[], deletedInteractions: Interaction[], existingInteractions: Interaction[], wasNameModified: boolean, relationship: Relationship): Interaction[] {
		// update the owner name on the interactions belonging to the edited relationship if the relationship's name was modified
		if (wasNameModified) {
			const unmodifiedInteractions = existingInteractions.filter(({ idOfRelationship }) => idOfRelationship === relationship._id)
			const targetInteractions = [ ...modifiedInteractions, ...unmodifiedInteractions ]
			targetInteractions.forEach(interaction => interaction.nameOfPerson = relationship.fullName)
		}

		// remove the old versions of the updated interactions
		const interactionsWithoutUpdated = existingInteractions.filter(({ _id }) =>
			modifiedInteractions.every(modified => modified._id !== _id)
		)

		// remove the deleted interactions
		const interactionsWithoutUpdatedOrDeleted = interactionsWithoutUpdated.filter(({ _id }) =>
			deletedInteractions.every(deleted => deleted._id !== _id)
		)

		// insert the updated interactions in the correct sorted positions
		let refreshedInteractions = interactionsWithoutUpdatedOrDeleted
		modifiedInteractions.forEach(modifiedInteraction =>
			refreshedInteractions = this.insertInteractionInOrder(refreshedInteractions, modifiedInteraction)
		)

		return refreshedInteractions
	}

}
