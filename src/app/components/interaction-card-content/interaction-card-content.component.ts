import { DatePipe } from '@angular/common'
import { AfterViewInit, Component, inject, input, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'

import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'

import { HorizontalScrollButtonsComponent } from '../horizontal-scroll-buttons/horizontal-scroll-buttons.component'
import { Interaction } from '../../interfaces/interaction.interface'
import { NewlinesToBrPipe } from "../../pipes/newlines-to-br.pipe"
import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { Topic } from "../../interfaces/interaction.interface"

@Component({
	selector: 'app-interaction-card-content',
	standalone: true,
	imports: [
		DatePipe, HorizontalScrollButtonsComponent,
		MatBottomSheetModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatIconModule, NewlinesToBrPipe
	],
	templateUrl: './interaction-card-content.component.html',
	styleUrl: './interaction-card-content.component.scss'
})
export class InteractionCardContentComponent implements AfterViewInit {
	private readonly bottomSheet = inject(MatBottomSheet)
	private readonly dialog = inject(MatDialog)
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly viewContainerRef = inject(ViewContainerRef)

	readonly interaction = input.required<Interaction>()
	private readonly contentTemplate = viewChild<TemplateRef<HTMLElement>>('content')
	private readonly topicNotesTemplate = viewChild<TemplateRef<HTMLElement>>('topicNotesSheet')
	private readonly topicNotesDialogTemplate = viewChild<TemplateRef<HTMLElement>>('topicNotesDialog')

	private bottomSheetRef?: MatBottomSheetRef<HTMLElement>
	readonly selectedTopic = signal<Topic|null>(null)

	ngAfterViewInit(): void {
		this.viewContainerRef.createEmbeddedView(this.contentTemplate()!)
		this.viewContainerRef.element.nativeElement.remove()
	}

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
