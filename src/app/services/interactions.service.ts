import { inject, Injectable } from '@angular/core'
import { lastValueFrom, map, Observable } from 'rxjs'
import { DateTime } from 'luxon'

import { MatDialog } from '@angular/material/dialog'

import { ApiService } from './api.service'
import { Cancelable } from '../interfaces/misc.interface'
import { DeletionService } from './deletion.service'
import { Interaction, InteractionGroup, TimeUnit } from "../interfaces/interaction.interface"
import { InteractionDialogComponent, InteractionDialogData, InteractionDialogResult } from '../components/interaction-dialog/interaction-dialog.component'
import { InteractionUtilitiesService } from './interaction-utilities.service'
import { MaterialConfigService } from './material-config.service'
import { RelationshipFormService } from './relationship-form.service'

interface InteractionLocationInGroup {
	groupKey: string
	indexInGroup: number
}

interface InteractionGroupingResult extends InteractionLocationInGroup {
	groups: InteractionGroup[]
}

type AddInteractionResult = Cancelable<{
	interaction: Interaction
	updatedInteractions: Interaction[]
}>

@Injectable({ providedIn: 'root' })
export class InteractionsService {
	private readonly api = inject(ApiService)
	private readonly dialog = inject(MatDialog)
	private readonly deletionService = inject(DeletionService)
	private readonly interactionUtils = inject(InteractionUtilitiesService)
	private readonly materialConfig = inject(MaterialConfigService)

	/** Prompts the user to add a new interaction.
	 * @returns The new interaction and the updated interactions array with the new interaction inserted in order, or `{wasCancelled: true}` if the user clicks Cancel */
	async addInteraction(existingInteractions: Interaction[]): Promise<AddInteractionResult>
	/** Prompts the user to add a new interaction.
	 * @returns The new interaction and the updated relationship form with the new interaction added, or `{wasCancelled: true}` if the user clicks Cancel */
	async addInteraction(formService: RelationshipFormService): Promise<InteractionDialogResult>
	async addInteraction(arg: Interaction[] | RelationshipFormService): Promise<AddInteractionResult | InteractionDialogResult> {
		const customConfig: Partial<InteractionDialogData> = { isAddingInteraction: true }
		const isFormService = arg instanceof RelationshipFormService

		if (!isFormService) customConfig.showRelationshipPicker = true

		const result: InteractionDialogResult = await this.openInteractionDialog(customConfig, isFormService ? arg : undefined)
		const { wasCancelled, interaction } = result
		if (wasCancelled) return { wasCancelled }

		if (isFormService) return result
		else return {
			wasCancelled,
			interaction,
			updatedInteractions: this.interactionUtils.insertInteractionInOrder(arg, interaction)
		}
	}

	/** Promts the user to edit an interaction.
	 * @returns The updated interaction and the updated interactions array, or `{wasCancelled: true}` if the user clicks Cancel. */
	async editInteraction(interaction: Interaction, existingInteractions: Interaction[]): Promise<AddInteractionResult>
	/** Promts the user to edit an interaction.
	 * @returns The updated interaction and the updated relationship form, or `{wasCancelled: true}` if the user clicks Cancel. */
	async editInteraction(interaction: Interaction, formService: RelationshipFormService): Promise<InteractionDialogResult>
	async editInteraction(interaction: Interaction, arg: Interaction[] | RelationshipFormService): Promise<InteractionDialogResult | AddInteractionResult> {
		if (arg instanceof RelationshipFormService) return this.openInteractionDialog({ interaction, isEditingInteraction: true }, arg)
		const existingInteractions = arg

		const { wasCancelled, interaction: updatedInteraction } = await this.openInteractionDialog({
			relationshipId: interaction.idOfRelationship,
			relationshipName: interaction.nameOfPerson,
			interaction,
			isEditingInteraction: true,
		})
		if (wasCancelled) return { wasCancelled }

		// update the interactions array
		let updatedInteractions: Interaction[]
		if (interaction.date === updatedInteraction.date) {
			// date is unchanged, so interaction stays in same position
			updatedInteractions = existingInteractions.map( interaction => interaction._id === updatedInteraction._id ? updatedInteraction : interaction )
		} else {
			// date changed, so interaction may need to move to a new position
			const interactionsWithoutEdited = existingInteractions.filter(interaction => interaction._id !== updatedInteraction._id)
			updatedInteractions = this.interactionUtils.insertInteractionInOrder(interactionsWithoutEdited, updatedInteraction)
		}

		return { wasCancelled, interaction: updatedInteraction, updatedInteractions }
	}

	private async openInteractionDialog(customDialogConfig: Partial<InteractionDialogData>, formService?: RelationshipFormService): Promise<InteractionDialogResult> {
		// save relationship changes before opening the interaction dialog
		if (formService?.wasRelationshipModified) await lastValueFrom(formService.saveRelationship())

		// prepare data for the interaction dialog
		const relationship = formService?.getRelationship()
		const data: Partial<InteractionDialogData> = {
			relationshipId: relationship?._id ?? null,
			relationshipName: relationship?.fullName ?? null,
			...customDialogConfig,
		}
		const config = this.materialConfig.getResponsiveDialogConfig(data)

		// open the interaction dialog and return the result
		return lastValueFrom(this.dialog.open(InteractionDialogComponent, config).afterClosed())
	}

	/** @returns `false` if user clicked Cancel, `true` if interaction was deleted */
	deleteInteraction(interaction: Interaction, formService?: RelationshipFormService): Observable<boolean> {
		return this.deletionService.deleteWithConfirmation(
			this.api.deleteInteraction(interaction),
			`an interaction with ${interaction.nameOfPerson}`
		).pipe(
			map(result => {
				if (result.wasCancelled) return false
				if (formService) formService.processDeleteInteractionResult(interaction, result)
				return true
			})
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
