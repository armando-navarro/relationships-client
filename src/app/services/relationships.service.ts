import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiService } from './api.service'
import { DeletionService } from './deletion.service'
import { Relationship } from '../interfaces/relationship.interface'

@Injectable({ providedIn: 'root' })
export class RelationshipsService {
	private readonly api = inject(ApiService)
	private readonly deletionService = inject(DeletionService)

	/** @returns false if user clicked Cancel, true if relationship was deleted */
	deleteRelationship({ _id, firstName }: Relationship): Observable<boolean> {
		return this.deletionService.deleteWithConfirmation(this.api.deleteRelationship(_id!), firstName)
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
