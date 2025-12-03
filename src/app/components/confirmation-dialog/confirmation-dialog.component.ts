import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog'

interface DeleteTarget {
	deleteTarget: string
}

@Component({
	selector: 'app-confirmation-dialog',
	standalone: true,
	imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
	templateUrl: './confirmation-dialog.component.html',
	styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
	readonly data = inject<DeleteTarget>(MAT_DIALOG_DATA)
}
