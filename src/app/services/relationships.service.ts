import { inject, Injectable, WritableSignal } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiService } from './api.service'
import { DeletionService } from './deletion.service'
import { AttentionNeededStatus, RelationshipDerivedProperties, Relationship, RelationshipGroup, RelationshipsGroupedByStatus } from '../interfaces/relationship.interface'

interface RelationshipLocationInGroup {
	groupStatus: AttentionNeededStatus
	indexInGroup: number
}

interface RelationshipGroupingResult extends RelationshipLocationInGroup {
	groups: RelationshipsGroupedByStatus
}

@Injectable({ providedIn: 'root' })
export class RelationshipsService {
	private readonly api = inject(ApiService)
	private readonly deletionService = inject(DeletionService)

	/** @returns false if user clicked Cancel, true if relationship was deleted */
	deleteRelationship({ _id, firstName }: Relationship): Observable<RelationshipDerivedProperties|boolean> {
		return this.deletionService.deleteWithConfirmation(this.api.deleteRelationship(_id!), firstName)
	}

	sortRelationshipsByAttentionNeededAscending(a: Relationship, b: Relationship): number {
		if (a.daysUntilAttentionNeeded === undefined) return 1
		if (b.daysUntilAttentionNeeded === undefined) return -1
		if (a.daysUntilAttentionNeeded!.valueOf() > b.daysUntilAttentionNeeded!.valueOf()) return 1
		if (a.daysUntilAttentionNeeded!.valueOf() < b.daysUntilAttentionNeeded!.valueOf()) return -1
		else return 0
	}

	groupRelationshipsByAttentionNeededStatus(relationships: Relationship[], targetRelationship: Relationship): RelationshipGroupingResult {
		let targetGroupStatus = AttentionNeededStatus.NotAvailable
		let targetIndexInGroup = -1
		const groups: RelationshipsGroupedByStatus = {
			[AttentionNeededStatus.Overdue]: {
				status: AttentionNeededStatus.Overdue,
				statusColor: '#FF0205',
				relationships: [],
			},
			[AttentionNeededStatus.Today]: {
				status: AttentionNeededStatus.Today,
				statusColor: '#1280FD',
				relationships: [],
			},
			[AttentionNeededStatus.Soon]: {
				status: AttentionNeededStatus.Soon,
				statusColor: '#FBBF24',
				relationships: [],
			},
			[AttentionNeededStatus.Good]: {
				status: AttentionNeededStatus.Good,
				statusColor: '#65C800',
				relationships: [],
			},
			[AttentionNeededStatus.NotAvailable]: {
				status: AttentionNeededStatus.NotAvailable,
				statusColor: 'inherit',
				relationships: [],
			},
		}
		relationships.forEach(relationship => {
			groups[relationship.attentionNeededStatus!].relationships.push(relationship)
			if (relationship._id === targetRelationship._id) {
				targetGroupStatus = relationship.attentionNeededStatus!
				targetIndexInGroup = groups[relationship.attentionNeededStatus!].relationships.length - 1
			}
		})
		return { groups, groupStatus: targetGroupStatus, indexInGroup: targetIndexInGroup }
	}

	addRelationshipToGroups(newRelationship: Relationship, groups: WritableSignal<RelationshipGroup[]>): RelationshipLocationInGroup {
		let insertIndex = -1
		groups.update(groups => {
			return groups.map(group => {
				if (group.status === newRelationship.attentionNeededStatus) {
					const result = this.insertRelationshipInOrder(group.relationships, newRelationship)
					group.relationships = result.relationships
					insertIndex = result.insertIndex
				}
				return group
			})
		})
		return {
			groupStatus: newRelationship.attentionNeededStatus!,
			indexInGroup: insertIndex,
		}
	}

	/** Inserts a relationship into the proper spot in an array of relationships sorted ascending by `daysUntilAttentionNeeded`. */
	private insertRelationshipInOrder(sortedRelationships: Relationship[], newRelationship: Relationship): { relationships: Relationship[], insertIndex: number } {
		if (newRelationship.daysUntilAttentionNeeded === undefined) {
			const updatedrelationships = [ ...sortedRelationships, newRelationship ]
			return { relationships: updatedrelationships, insertIndex: updatedrelationships.length - 1 }
		}

		let low = 0
		let high = sortedRelationships.length

		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			if (sortedRelationships[mid].daysUntilAttentionNeeded! < newRelationship.daysUntilAttentionNeeded!) low = mid + 1
			else high = mid
		}
		const updatedrelationships = [
			...sortedRelationships.slice(0, low),
			newRelationship,
			...sortedRelationships.slice(low)
		]
		return { relationships: updatedrelationships, insertIndex: low}
	}

	// TODO: I THINK THIS FUNCTION IS BEING CALLED TOO MANY TIMES
	updateRelationshipInGroups(updatedRelationship: Relationship, groups: RelationshipGroup[]): RelationshipGroupingResult {
		const relationships = Object.values(groups).flatMap(({ relationships }) =>
			relationships.map(relationship => relationship._id === updatedRelationship._id ? updatedRelationship : relationship)
		)
		relationships.sort(this.sortRelationshipsByAttentionNeededAscending)
		return this.groupRelationshipsByAttentionNeededStatus(relationships, updatedRelationship)
	}

	/** Note this uses Array.sort which modifies the original array. */
	sortByFirstName(relationships: Relationship[]): Relationship[] {
		return relationships.sort((a, b) => {
			if (a.firstName! > b.firstName!) return 1
			if (a.firstName! < b.firstName!) return -1
			return 0
		})
	}

}
