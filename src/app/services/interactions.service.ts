import { inject, Injectable, signal } from '@angular/core'
import { Observable } from 'rxjs'
import { DateTime } from 'luxon'

import { ApiService } from './api.service'
import { DeletionService } from './deletion.service'
import { Interaction, InteractionGroup, TimeUnit } from "../interfaces/interaction.interface"

@Injectable({ providedIn: 'root' })
export class InteractionsService {
	readonly interactionsForUnsavedRelationship = signal<Interaction[]>([])

	private readonly api = inject(ApiService)
	private readonly deletionService = inject(DeletionService)

	/** Inserts an interaction into the proper spot in an array of interactions sorted descending by date. */
	insertInteractionInOrder(sortedInteractions: Interaction[], newInteraction: Interaction): Interaction[] {
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

	/** @returns false if user clicked Cancel, true if interaction was deleted */
	deleteInteraction(deleteTarget: Interaction, relationshipId: string, personName: string): Observable<boolean> {
		return this.deletionService.deleteWithConfirmation(
			this.api.deleteInteraction(deleteTarget._id!, relationshipId),
			`an interaction with ${personName}`
		)
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
