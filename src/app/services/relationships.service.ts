import { inject, Injectable, signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { mergeMap, Observable, of } from 'rxjs'

import { ApiService } from './api.service'
import { Relationship } from '../interfaces/relationship.interface'
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component'

@Injectable({ providedIn: 'root' })
export class RelationshipsService {
	readonly unsavedRelationship = signal<Relationship|undefined>(undefined)

	private readonly api = inject(ApiService)
	private readonly dialog = inject(MatDialog)

	/** @returns false if user clicked Cancel, true if relationship was deleted */
	deleteRelationship({ _id, firstName }: Relationship): Observable<boolean> {
		const dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: { deleteTarget: firstName } })
		return dialogRef.afterClosed().pipe(
			mergeMap(deleteConfirmed => {
				if (!deleteConfirmed) return of(false)
				return this.api.deleteRelationship(_id!)
			})
		)
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
