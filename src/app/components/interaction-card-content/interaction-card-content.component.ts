import { DatePipe } from '@angular/common'
import { AfterViewInit, Component, inject, input, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'

import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'

import { Interaction } from '../../interfaces/interaction.interface'
import { Topic } from "../../interfaces/interaction.interface"

@Component({
	selector: 'app-interaction-card-content',
	standalone: true,
	imports: [DatePipe, MatBottomSheetModule, MatButtonModule, MatChipsModule, MatIconModule],
	templateUrl: './interaction-card-content.component.html',
	styleUrl: './interaction-card-content.component.scss'
})
export class InteractionCardContentComponent implements AfterViewInit {
	private readonly bottomSheet = inject(MatBottomSheet)
	private readonly viewContainerRef = inject(ViewContainerRef)

	readonly interaction = input.required<Interaction>()
	private readonly contentTemplate = viewChild<TemplateRef<HTMLElement>>('content')
	private readonly topicNotesTemplate = viewChild<TemplateRef<HTMLElement>>('topicNotes')

	private bottomSheetRef?: MatBottomSheetRef<HTMLElement>
	readonly selectedTopic = signal<Topic|null>(null)

	ngAfterViewInit(): void {
		this.viewContainerRef.createEmbeddedView(this.contentTemplate()!)
		this.viewContainerRef.element.nativeElement.remove()
	}

	onTopicClick(topic: Topic): void {
		this.selectedTopic.set(topic)
		this.bottomSheetRef = this.bottomSheet.open(this.topicNotesTemplate()!, { panelClass: 'topic-bottom-sheet' })
	}

	onCloseTopicClick(): void {
		this.bottomSheetRef?.dismiss()
	}

}
