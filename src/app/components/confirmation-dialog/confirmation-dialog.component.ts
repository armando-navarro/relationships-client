import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog'

export interface ConfirmationDialogData {
	titleText?: string
	dialogText: string
	noText?: string
	yesText?: string
}

@Component({
	selector: 'app-confirmation-dialog',
	standalone: true,
	imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
	templateUrl: './confirmation-dialog.component.html',
	styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
	readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA)
}
