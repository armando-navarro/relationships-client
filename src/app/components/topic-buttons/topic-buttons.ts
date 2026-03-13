import { Component, inject, input, signal, TemplateRef, viewChild } from '@angular/core'

import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { HorizontalScrollButtons } from '../horizontal-scroll-buttons/horizontal-scroll-buttons'
import { NewlinesToBrPipe } from '../../pipes/newlines-to-br-pipe'
import { ResponsiveUi } from '../../services/responsive-ui'
import { Topic } from '../../interfaces/interaction-interface'

@Component({
	selector: 'app-topic-buttons',
	imports: [
    MatBottomSheetModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatIconModule, MatTooltipModule,
    HorizontalScrollButtons, NewlinesToBrPipe,
],
	templateUrl: './topic-buttons.html',
	styleUrl: './topic-buttons.scss'
})
export class TopicButtons {
	private readonly bottomSheet = inject(MatBottomSheet)
	private readonly dialog = inject(MatDialog)
	private readonly responsiveUi = inject(ResponsiveUi)

	readonly topics = input.required<Topic[]>()

	private readonly topicNotesTemplate = viewChild<TemplateRef<HTMLElement>>('topicNotesSheet')
	private readonly topicNotesDialogTemplate = viewChild<TemplateRef<HTMLElement>>('topicNotesDialog')

	protected readonly selectedTopic = signal<Topic|null>(null)
	private bottomSheetRef?: MatBottomSheetRef<HTMLElement>

	protected onTopicClick(topic: Topic): void {
		this.selectedTopic.set(topic)
		if (this.responsiveUi.isSmallViewport()) {
			this.bottomSheetRef = this.bottomSheet.open(this.topicNotesTemplate()!, { panelClass: 'topic-bottom-sheet' })
		} else {
			this.dialog.open(this.topicNotesDialogTemplate()!, { disableClose: false })
		}
	}

	protected onCloseTopicClick(): void {
		this.bottomSheetRef?.dismiss()
	}

}
