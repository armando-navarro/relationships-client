import { Injectable } from '@angular/core'
import { FormArray } from '@angular/forms'

import { Interaction, InteractionFormGroup } from './interaction-interface'

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

}
