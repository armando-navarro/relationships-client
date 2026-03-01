import { inject, Injectable } from '@angular/core'
import { catchError, map, mergeMap, Observable, of } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

import { Cancelable } from '../interfaces/misc.interface'
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component'
import { MaterialConfigService } from './material-config.service'
import { RelationshipDerivedProperties as DerivedProps } from '../interfaces/relationship.interface'

export type DeletionResult = Cancelable<DerivedProps>

@Injectable({ providedIn: 'root' })
export class DeletionService {
	private readonly dialog = inject(MatDialog)
	private readonly materialConfig = inject(MaterialConfigService)
	private readonly snackBar = inject(MatSnackBar)

	deleteWithConfirmation(delete$: Observable<DerivedProps>, deleteTarget: string): Observable<DeletionResult> {
		const dialogText = `Are you sure you want to delete ${deleteTarget}?<br />This action cannot be undone.`
		const config = this.materialConfig.getResponsiveDialogConfig({ dialogText })

		return this.dialog.open(ConfirmationDialogComponent, config).afterClosed().pipe(
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
