import { inject, Injectable, signal } from '@angular/core'
import { Observable, of, tap } from 'rxjs'
import { DateTime } from 'luxon'

import { ApiService } from './api.service'
import { DeletionService } from './deletion.service'
import { Interaction, InteractionGroup, TimeUnit } from "../interfaces/interaction.interface"

@Injectable({ providedIn: 'root' })
export class InteractionsService {
	private readonly selectedInteraction = signal<Interaction|undefined>(undefined)
	readonly interactionsForUnsavedRelationship = signal<Interaction[]>([])

	private readonly api = inject(ApiService)
	private readonly deletionService = inject(DeletionService)

	getSelectedInteraction(relationshipId?: string, interactionId?: string): Observable<Interaction|undefined> {
		if (!relationshipId) return of(this.selectedInteraction())
		if (!interactionId) throw new Error('Relationship ID and Interaction ID are required')
		if (this.selectedInteraction()?._id === interactionId) return of(this.selectedInteraction())

		return this.api.getInteraction(relationshipId, interactionId)
	}

	setSelectedInteraction(interaction: Interaction|undefined): void {
		this.selectedInteraction.set(interaction)
	}

	addInteractionToUnsavedRelationship(newInteraction: Interaction): void {
		const unsavedInteractions = this.interactionsForUnsavedRelationship()
		this.insertInteractionInOrder(unsavedInteractions, newInteraction)
	}

	/** Inserts an interaction into the proper spot in an array of interactions sorted descending by date. */
	private insertInteractionInOrder(sortedInteractions: Interaction[], newInteraction: Interaction): void {
		let low = 0
		let high = sortedInteractions.length

		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			if (sortedInteractions[mid].date! > newInteraction.date!) low = mid + 1
			else high = mid
		}

		sortedInteractions.splice(low, 0, newInteraction)
	}

	/** @returns false if user clicked Cancel, true if interaction was deleted */
	deleteInteraction(deleteTarget: Interaction): Observable<boolean> {
		return this.deletionService.deleteWithConfirmation(
			this.api.deleteInteraction(deleteTarget._id!, deleteTarget.idOfRelationship!),
			`an interaction with ${deleteTarget.nameOfPerson}`
		).pipe(tap(targetDeleted => {
			if (targetDeleted) this.deleteUnsavedInteraction(deleteTarget)
		}))
	}

	private deleteUnsavedInteraction(deleteTarget: Interaction): Observable<boolean> {
		const targetIndex = this.interactionsForUnsavedRelationship().findIndex(({ type, date }) =>
			type === deleteTarget.type && date!.valueOf() === deleteTarget.date!.valueOf()
		)
		if (targetIndex > -1) {
			this.interactionsForUnsavedRelationship.set([
				...this.interactionsForUnsavedRelationship().slice(0, targetIndex),
				...this.interactionsForUnsavedRelationship().slice(targetIndex + 1)
			])
			return of(true)
		} else {
			return of(false)
		}
	}

	/** Expects an array of interactions sorted descending by date. */
	groupBy(sortedInteractions: Interaction[], groupBy: TimeUnit): InteractionGroup[] {
		const groupedInteractions: InteractionGroup[] = []

		sortedInteractions.forEach(interaction => {
			const startOfTargetTimeUnit = DateTime.fromJSDate(interaction.date!).startOf(groupBy, { useLocaleWeeks: true })
			const startOfCurrentTimeUnit = DateTime.now().startOf(groupBy, { useLocaleWeeks: true })
			const timeUnitsAgo = startOfCurrentTimeUnit.diff(startOfTargetTimeUnit, `${groupBy}s`).as(`${groupBy}s`)
			const timeAgoText = startOfTargetTimeUnit.toRelativeCalendar({ base: startOfCurrentTimeUnit, unit: `${groupBy}s` }) || ''

			const lastGroup = groupedInteractions[groupedInteractions.length - 1]
			if (!lastGroup || lastGroup.timeUnitsAgo !== timeUnitsAgo) {
				groupedInteractions.push({
					groupedBy: groupBy,
					timeUnitsAgo,
					timeAgoText: timeAgoText.replace(/\b\w/g, (char) => char.toUpperCase()),
					interactions: [interaction]
				})
			}
			else lastGroup.interactions.push(interaction)
		})
		return groupedInteractions
	}

	sortInteractionsDesc(a: Interaction, b: Interaction): number {
		if (a.date!.valueOf() > b.date!.valueOf()) return -1
		if (a.date!.valueOf() < b.date!.valueOf()) return 1
		else return 0
	}

	sortInteractionsAsc(a: Interaction, b: Interaction): number {
		if (a.date!.valueOf() > b.date!.valueOf()) return 1
		if (a.date!.valueOf() < b.date!.valueOf()) return -1
		else return 0
	}

}
