import { inject, Injectable } from '@angular/core'
import { map, Observable, of, switchMap } from 'rxjs'

import { MatDialog } from '@angular/material/dialog'

import { ApiService } from './api.service'
import { Cancelable } from '../interfaces/misc.interface'
import { DeletionResult, DeletionService } from './deletion.service'
import { MaterialConfigService } from './material-config.service'
import { AttentionNeededStatus, Relationship, RelationshipGroup } from '../interfaces/relationship.interface'
import { RelationshipDialogComponent, RelationshipDialogData, RelationshipDialogResult } from '../components/relationship-dialog/relationship-dialog.component'
import { RelationshipUtilitiesService } from './relationship-utilities.service'

type RelationshipGroupingResult = Cancelable<{
	groups: RelationshipGroup[]
	targetGroupStatus: AttentionNeededStatus
	targetRelationshipIndex: number
}>

type RelationshipEditResult = Cancelable<{
	relationship: Relationship
	wasNameModified: boolean
	wereInteractionsModified: boolean
}>

@Injectable({ providedIn: 'root' })
export class RelationshipsService {
	private readonly api = inject(ApiService)
	private readonly deletionService = inject(DeletionService)
	private readonly dialog = inject(MatDialog)
	private readonly materialConfig = inject(MaterialConfigService)
	private readonly relationshipUtils = inject(RelationshipUtilitiesService)

	/** Prompts the user to add a new relationship.
	 * @returns `wasCancelled: true` if the user clicks Cancel, or the updated relationship groups and the new relationship's location */
	addRelationship(groupedRelationships: RelationshipGroup[]): Observable<RelationshipGroupingResult> {
		const data: RelationshipDialogData = { relationship: null, isAddingRelationship: true }
		const config = this.materialConfig.getResponsiveDialogConfig(data)

		return this.dialog.open(RelationshipDialogComponent, config).afterClosed().pipe(
			map(({ wasCancelled, relationship }: RelationshipDialogResult) => {
				if (wasCancelled) return { wasCancelled }
				else {
					// add new relationship to a group based on the relationship's `attentionNeededStatus` property.
					const targetGroup = groupedRelationships.find(({ status }) => status === relationship.attentionNeededStatus)!
					const { relationships, insertIndex } = this.insertRelationshipInOrder(targetGroup.relationships, relationship)
					targetGroup.relationships = relationships

					return {
						wasCancelled: false,
						groups: groupedRelationships,
						targetGroupStatus: targetGroup.status,
						targetRelationshipIndex: insertIndex,
					}
				}
			})
		)
	}

	/** Inserts a relationship into the properly ordered spot in an array of relationships sorted ascending by `daysUntilAttentionNeeded`. */
	private insertRelationshipInOrder(sortedRelationships: Relationship[], newRelationship: Relationship): { relationships: Relationship[], insertIndex: number } {
		// place relationships with no interactions or no interaction goal at the end
		if (newRelationship.daysUntilAttentionNeeded === undefined) {
			const updatedrelationships = [ ...sortedRelationships, newRelationship ]
			return { relationships: updatedrelationships, insertIndex: updatedrelationships.length - 1 }
		}

		// use binary search to identify insertion point
		let low = 0
		let high = sortedRelationships.length
		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			if (sortedRelationships[mid].daysUntilAttentionNeeded! < newRelationship.daysUntilAttentionNeeded!) low = mid + 1
			else high = mid
		}

		// insert new relationship into sorted array
		const updatedrelationships = [
			...sortedRelationships.slice(0, low),
			newRelationship,
			...sortedRelationships.slice(low)
		]
		return { relationships: updatedrelationships, insertIndex: low}
	}

	/** Prompts the user to edit a relationship.
	 * @param relationship The relationship to edit, or the ID of the relationship.
	 * @param currentGroups Optional. If provided, returns updated relationship groups and the relationship's new location.
	 * @returns The updated relationship groups and the relationship's new location (given by the group's status and the relationship's index
	 * in the group) if `currentGroups` is provided, or just the updated relationship if not. Returns `{wasCancelled: true}` if the user clicks Cancel. */
	editRelationship(relationship: string|Relationship, currentGroups: RelationshipGroup[]): Observable<RelationshipGroupingResult>
	editRelationship(relationship: string|Relationship, currentGroups?: undefined): Observable<RelationshipEditResult>
	editRelationship(relationship: string|Relationship, currentGroups?: RelationshipGroup[]): Observable<RelationshipGroupingResult|RelationshipEditResult> {
		const relationship$ = typeof relationship === 'string'
			? this.api.getRelationship(relationship)
			: of(relationship)

		return relationship$.pipe(
			switchMap(relationship => this.openEditDialog(relationship)),
			map(({ wasCancelled, relationship, wasNameModified, wereInteractionsModified }) => {
				if (wasCancelled) return { wasCancelled }
				if (currentGroups) return this.updateRelationshipGroups(relationship, currentGroups)
				return { wasCancelled, relationship, wasNameModified, wereInteractionsModified }
			})
		)
	}

	/** Opens the edit relationship dialog and returns an observable that emits the result. */
	private openEditDialog(relationship: Relationship): Observable<RelationshipDialogResult> {
		const data: RelationshipDialogData = { relationship, isEditingRelationship: true }
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		return this.dialog.open(RelationshipDialogComponent, config).afterClosed()
	}

	/** Updates the relationship groups with the provided updated relationship. */
	private updateRelationshipGroups(updatedRelationship: Relationship, groups: RelationshipGroup[]): RelationshipGroupingResult {
		// extract relationships from groups and replace old relationship with updated relationship
		const allRelationships = groups.flatMap(({ relationships }) =>
			relationships.map(relationship => relationship._id === updatedRelationship?._id ? updatedRelationship : relationship)
		)
		return this.groupRelationshipsByAttentionNeededStatus(allRelationships, updatedRelationship._id!)
	}

	/** Groups relationships by their attention needed status and locates a specific relationship within the groups. */
	private groupRelationshipsByAttentionNeededStatus(relationships: Relationship[], relationshipIdToLocate?: string): RelationshipGroupingResult {
		const statusToGroupMap = new Map<AttentionNeededStatus, RelationshipGroup>()
		let targetGroupStatus = AttentionNeededStatus.NotAvailable
		let targetRelationshipIndex = -1

		const sortedRelationships = this.relationshipUtils.sortByAttentionNeededAscending(relationships)
		sortedRelationships.forEach(relationship => {
			// add relationship to existing group or create a new one if needed
			const group = statusToGroupMap.get(relationship.attentionNeededStatus!) ?? {
				status: relationship.attentionNeededStatus!,
				statusColor: relationship.attentionStatusColor!,
				relationships: [],
			}
			group.relationships.push(relationship)
			statusToGroupMap.set(relationship.attentionNeededStatus!, group)

			// identify the target relationship's new location
			if (relationship._id === relationshipIdToLocate) {
				targetGroupStatus = relationship.attentionNeededStatus!
				targetRelationshipIndex = group.relationships.length - 1
			}
		})

		return {
			wasCancelled: false,
			groups: this.relationshipUtils.orderRelationshipGroups(statusToGroupMap),
			targetGroupStatus,
			targetRelationshipIndex
		}
	}

	/** @returns `false` if user clicked Cancel, `true` if relationship was deleted */
	deleteRelationship({ _id, firstName }: Relationship): Observable<boolean> {
		return this.deletionService.deleteWithConfirmation(this.api.deleteRelationship(_id!), firstName).pipe(
			map(({ wasCancelled }) => !wasCancelled)
		)
	}

}
