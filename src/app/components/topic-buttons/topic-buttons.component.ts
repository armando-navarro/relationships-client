import { Component, inject, input, signal, TemplateRef, viewChild } from '@angular/core'

import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'

import { HorizontalScrollButtonsComponent } from "../horizontal-scroll-buttons/horizontal-scroll-buttons.component"
import { NewlinesToBrPipe } from '../../pipes/newlines-to-br.pipe'
import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { Topic } from '../../interfaces/interaction.interface'

@Component({
	selector: 'app-topic-buttons',
	standalone: true,
	imports: [
    MatBottomSheetModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatIconModule,
    HorizontalScrollButtonsComponent, NewlinesToBrPipe,
],
	templateUrl: './topic-buttons.component.html',
	styleUrl: './topic-buttons.component.scss'
})
export class TopicButtonsComponent {
	private readonly bottomSheet = inject(MatBottomSheet)
	private readonly dialog = inject(MatDialog)
	private readonly responsiveUiService = inject(ResponsiveUiService)

	readonly topics = input.required<Topic[]>()

	private readonly topicNotesTemplate = viewChild<TemplateRef<HTMLElement>>('topicNotesSheet')
	private readonly topicNotesDialogTemplate = viewChild<TemplateRef<HTMLElement>>('topicNotesDialog')

	readonly selectedTopic = signal<Topic|null>(null)
	private bottomSheetRef?: MatBottomSheetRef<HTMLElement>

	onTopicClick(topic: Topic): void {
		this.selectedTopic.set(topic)
		if (this.responsiveUiService.isSmallViewport()) {
			this.bottomSheetRef = this.bottomSheet.open(this.topicNotesTemplate()!, { panelClass: 'topic-bottom-sheet' })
		} else {
			this.dialog.open(this.topicNotesDialogTemplate()!, { disableClose: false })
		}
	}

	onCloseTopicClick(): void {
		this.bottomSheetRef?.dismiss()
	}

}
