import { Injectable } from '@angular/core'
import { AttentionNeededStatus, Relationship, RelationshipGroup } from '../interfaces/relationship.interface'

@Injectable({ providedIn: 'root' })
export class RelationshipUtilitiesService {

	/** The order in which relationship groups should be displayed based on their status. */
	private readonly GROUP_BY_STATUS_ORDER = [
		AttentionNeededStatus.Today,
		AttentionNeededStatus.Overdue,
		AttentionNeededStatus.Soon,
		AttentionNeededStatus.Good,
		AttentionNeededStatus.NotAvailable,
	] as const

	/** Orders relationship groups by their attention needed status.
	 * @param groupsByStatus a map containing the relationship groups to be ordered, keyed by their attention needed status.
	 * @returns An array of relationship groups ordered by their attention needed status. */
	orderRelationshipGroups(groupsByStatus: Map<AttentionNeededStatus, RelationshipGroup>): RelationshipGroup[] {
		const orderedGroups = this.GROUP_BY_STATUS_ORDER.map(status => groupsByStatus.get(status))
		return orderedGroups.filter(group => !!group) as RelationshipGroup[]
	}

	/** @returns A new array of relationships sorted by `daysUntilAttentionNeeded` in ascending order.
	 * Relationships without `daysUntilAttentionNeeded` are placed at the end of the array. */
	sortByAttentionNeededAscending(relationships: Relationship[]): Relationship[] {
		return [...relationships].sort((a, b): number => {
			if (a.daysUntilAttentionNeeded === undefined) return 1
			if (b.daysUntilAttentionNeeded === undefined) return -1
			if (a.daysUntilAttentionNeeded!.valueOf() > b.daysUntilAttentionNeeded!.valueOf()) return 1
			if (a.daysUntilAttentionNeeded!.valueOf() < b.daysUntilAttentionNeeded!.valueOf()) return -1
			else return 0
		})
	}

	/** @returns A new array of relationships sorted by `firstName` in ascending order. */
	sortByFirstName(relationships: Relationship[]): Relationship[] {
		return [...relationships].sort((a, b) => {
			if (a.firstName! > b.firstName!) return 1
			if (a.firstName! < b.firstName!) return -1
			return 0
		})
	}

}
