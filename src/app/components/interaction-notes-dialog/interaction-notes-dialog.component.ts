import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog'

import { Topic } from '../../interfaces/interaction.interface'

@Component({
	selector: 'app-interaction-notes',
	standalone: true,
	imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
	templateUrl: './interaction-notes-dialog.component.html',
	styleUrl: './interaction-notes-dialog.component.scss'
})
export class InteractionNotesDialogComponent {
	readonly data = inject<Topic>(MAT_DIALOG_DATA)
}
