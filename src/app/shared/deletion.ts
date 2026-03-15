import { inject, Injectable } from '@angular/core'
import { catchError, map, mergeMap, Observable, of } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

import { Cancelable } from './misc-interface'
import { ConfirmationDialog } from './confirmation-dialog/confirmation-dialog'
import { MaterialConfig } from './material-config'
import { RelationshipDerivedProperties as DerivedProps } from '../relationships/relationship-interface'

export type DeletionResult = Cancelable<DerivedProps>

@Injectable({ providedIn: 'root' })
export class Deletion {
	private readonly dialog = inject(MatDialog)
	private readonly materialConfig = inject(MaterialConfig)
	private readonly snackBar = inject(MatSnackBar)

	/** Confirm a delete action, run it if approved, and normalize cancellation and error handling. */
	deleteWithConfirmation(delete$: Observable<DerivedProps>, deleteTarget: string): Observable<DeletionResult> {
		const dialogText = `Are you sure you want to delete ${deleteTarget}?<br />This action cannot be undone.`
		const config = this.materialConfig.getResponsiveDialogConfig({ dialogText })

		return this.dialog.open(ConfirmationDialog, config).afterClosed().pipe(
			mergeMap(deleteConfirmed => {
				if (deleteConfirmed) return delete$.pipe(map<DerivedProps, DeletionResult>(props => ({ wasCancelled: false, ...props })))
				return of<DeletionResult>({ wasCancelled: true })
			}),
			catchError(error => {
				this.snackBar.open('Deletion failed. Try again.', undefined)
				return of<DeletionResult>({ wasCancelled: true })
			}),
		)
	}

}
