import { inject, Injectable } from '@angular/core'
import { catchError, mergeMap, Observable, of } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component'
import { MaterialConfigService } from './material-config.service'
import { RelationshipDerivedProperties } from '../interfaces/relationship.interface'

@Injectable({ providedIn: 'root' })
export class DeletionService {
	private readonly dialog = inject(MatDialog)
	private readonly materialConfig = inject(MaterialConfigService)
	private readonly snackBar = inject(MatSnackBar)

	deleteWithConfirmation(deleteObservable: Observable<RelationshipDerivedProperties>, deleteTarget: string): Observable<RelationshipDerivedProperties|boolean> {
		const dialogText = `Are you sure you want to delete ${deleteTarget}?<br />This action cannot be undone.`
		const config = this.materialConfig.getResponsiveDialogConfig({ dialogText })

		return this.dialog.open(ConfirmationDialogComponent, config).afterClosed().pipe(
			mergeMap(deleteConfirmed => {
				if (!deleteConfirmed) return of(false)
				return deleteObservable
			}),
			catchError(error => {
				this.snackBar.open('Deletion failed. Try again.', undefined)
				return of(false)
			}),
		)
	}
}
