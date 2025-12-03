import { inject, Injectable, signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { mergeMap, Observable, of } from 'rxjs'
import { DateTime } from 'luxon'

import { ApiService } from './api.service'
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component'
import { Interaction, InteractionGroup, TimeUnit } from "../interfaces/interaction.interface"

@Injectable({ providedIn: 'root' })
export class InteractionsService {
	private readonly selectedInteraction = signal<Interaction|undefined>(undefined)
	readonly interactionsForUnsavedRelationship = signal<Interaction[]>([])

	private readonly api = inject(ApiService)
	private readonly dialog = inject(MatDialog)

	getSelectedInteraction(relationshipId?: string, interactionId?: string): Observable<Interaction|undefined> {
		if (!relationshipId) return of(this.selectedInteraction())
		if (!interactionId) throw new Error('Relationship ID and Interaction ID are required')
		if (this.selectedInteraction()?._id === interactionId) return of(this.selectedInteraction())

		return this.api.getInteraction(relationshipId, interactionId)
	}

	setSelectedInteraction(interaction: Interaction|undefined): void {
		this.selectedInteraction.set(interaction)
	}

	/** @returns false if user clicked Cancel, true if interaction was deleted */
	deleteInteraction(deleteTarget: Interaction): Observable<boolean> {
		const dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: { deleteTarget: `this interaction with ${deleteTarget.nameOfPerson}` } })
		return dialogRef.afterClosed().pipe(
			mergeMap(deleteConfirmed => {
				if (!deleteConfirmed) return of(false)
				if (deleteTarget._id) return this.api.deleteInteraction(deleteTarget._id!, deleteTarget.idOfRelationship!)
				return this.deleteUnsavedInteraction(deleteTarget)
			})
		)
	}

	private deleteUnsavedInteraction(deleteTarget: Interaction): Observable<boolean> {
		const targetIndex = this.interactionsForUnsavedRelationship().findIndex(({ type, date }) =>
			type === deleteTarget.type && date!.valueOf() === deleteTarget.date!.valueOf()
		)
		if (targetIndex > -1) {
			this.interactionsForUnsavedRelationship().splice(targetIndex, 1)
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

}
