import { inject, Injectable } from '@angular/core'
import { catchError, mergeMap, Observable, of } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component'
import { RelationshipDerivedProperties } from '../interfaces/relationship.interface'
import { SNACKBAR_CONFIG } from '../constants/misc-constants'

@Injectable({ providedIn: 'root' })
export class DeletionService {
	private readonly dialog = inject(MatDialog)
	private readonly snackBar = inject(MatSnackBar)
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG

	deleteWithConfirmation(deleteObservable: Observable<RelationshipDerivedProperties>, deleteTarget: string): Observable<RelationshipDerivedProperties|boolean> {
		const dialogText = `Are you sure you want to delete ${deleteTarget}?<br />This action cannot be undone.`
		return this.dialog.open(ConfirmationDialogComponent, { data: { dialogText }}).afterClosed().pipe(
			mergeMap(deleteConfirmed => {
				if (!deleteConfirmed) return of(false)
				return deleteObservable
			}),
			catchError(error => {
				this.snackBar.open('Deletion failed. Try again.', undefined, this.SNACKBAR_CONFIG)
				return of(false)
			}),
		)
	}
}
