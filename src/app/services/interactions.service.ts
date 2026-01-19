import { inject, Injectable } from '@angular/core'
import { FormArray } from '@angular/forms'
import { Observable } from 'rxjs'
import { DateTime } from 'luxon'

import { ApiService } from './api.service'
import { DeletionService } from './deletion.service'
import { Interaction, InteractionFormGroup, InteractionGroup, TimeUnit } from "../interfaces/interaction.interface"
import { RelationshipDerivedProperties } from '../interfaces/relationship.interface'

interface InteractionLocationInGroup {
	groupKey: string
	indexInGroup: number
}

interface InteractionGroupingResult extends InteractionLocationInGroup {
	groups: InteractionGroup[]
}

@Injectable({ providedIn: 'root' })
export class InteractionsService {
	private readonly api = inject(ApiService)
	private readonly deletionService = inject(DeletionService)

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

	/** @returns false if user clicked Cancel, true if interaction was deleted */
	deleteInteraction(deleteTarget: Interaction, relationshipId: string, personName: string): Observable<RelationshipDerivedProperties|boolean> {
		return this.deletionService.deleteWithConfirmation(
			this.api.deleteInteraction(deleteTarget._id!, relationshipId),
			`an interaction with ${personName}`
		)
	}

	/** Expects an array of interactions sorted descending by date.
	 * Groups interactions by the specified number of time units passed since the interaction occurred.
	 * @returns interactions grouped by time unit and the location of the interaction to highlight */
	groupBy(sortedInteractions: Interaction[], groupBy: TimeUnit, highlightInteraction: Interaction): InteractionGroupingResult {
		const groupedInteractions: InteractionGroup[] = []
		let groupKey = ''
		let indexInGroup = -1

		sortedInteractions.forEach(interaction => {
			// each interaction occurred before or on the same date as the previous interaction in the loop
			const interactionDate = DateTime.fromJSDate(interaction.date!)
			// number of days/weeks/months/years between interaction date and now
			const timeUnitsAgo = DateTime.now().diff(interactionDate, `${groupBy}s`).as(`${groupBy}s`)
			// text like "Today", "Last week", "3 months ago"
			const timeAgoText = this.getTimeAgoText(interactionDate, groupBy)
			// since interactions are sorted, we only need to check the last group added to see if this interaction belongs there
			let lastGroup = groupedInteractions[groupedInteractions.length - 1]

			// create group for this time unit
			if (!lastGroup || lastGroup.timeAgoText !== timeAgoText) {
				groupedInteractions.push({ groupedBy: groupBy, timeUnitsAgo, timeAgoText, interactions: [interaction] })
			} else { // group already exists for this time unit
				lastGroup.interactions.push(interaction)
			}

			// check if this is the interaction to highlight
			lastGroup = groupedInteractions[groupedInteractions.length - 1]
			if (interaction._id === highlightInteraction._id) {
				groupKey = timeAgoText
				indexInGroup = lastGroup.interactions.length - 1
			}
		})
		return { groups: groupedInteractions, groupKey, indexInGroup }
	}

	/** @returns A string describing the time elapsed since the given date in the specified time unit.
	 * E.g. "Today", "Yesterday", "Wednesday", "Last week", "2 months ago", "March 2020", "2021", etc. */
	private getTimeAgoText(pastDate: DateTime, timeUnit: TimeUnit): string {
		const now = DateTime.now()
		const isBeforeCurrentTimeUnit = !pastDate.hasSame(now, timeUnit)
		const isBeforeLastTimeUnit = isBeforeCurrentTimeUnit && !pastDate.hasSame(now.minus({ [`${timeUnit}s`]: 1 }), timeUnit)
		const isBeforeLastTwoTimeUnits = isBeforeLastTimeUnit && !pastDate.hasSame(now.minus({ [`${timeUnit}s`]: 2 }), timeUnit)

		const isOverAWeekAgo = pastDate.diffNow('weeks').toObject().weeks! <= -1
		const isOverAYearAgo = pastDate.diffNow('years').toObject().years! <= -1

		// use specific year for all previous years
		if (isBeforeCurrentTimeUnit && timeUnit === 'year') {
			return pastDate.toFormat('yyyy')
		}

		// use specific month name for dates 2 months ago or earlier, w/year as needed
		else if (isBeforeLastTimeUnit && timeUnit === 'month') {
			let format = 'LLLL'
			if (isOverAYearAgo) format += ' yyyy'
			return pastDate.toFormat(format)
		}

		// use specific day name or "week of" for dates 3 days/weeks ago or earlier, w/year as needed
		else if (isBeforeLastTwoTimeUnits) {
			if (timeUnit === 'day') {
				let format = 'cccc'
				if (isOverAWeekAgo) format += ', LLLL d'
				if (isOverAYearAgo) format = 'LLLL d, yyyy'
				return pastDate.toFormat(format)
			}
			if (timeUnit === 'week') {
				let format = 'LLL d'
				if (isOverAYearAgo) format += ', yyyy'
				const beginningOfWeek = pastDate.startOf(timeUnit, { useLocaleWeeks: true })
				return `Week of ${beginningOfWeek.toFormat(format)}`
			}
		}
		// use relative calendar text for everything else (e.g. "Today", "Yesterday", "Last week", etc.)
		const relativeCalendarText = pastDate.toRelativeCalendar({ base: now, unit: `${timeUnit}s` }) ?? ''
		return relativeCalendarText.replace(/\b\w/g, char => char.toUpperCase())
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
