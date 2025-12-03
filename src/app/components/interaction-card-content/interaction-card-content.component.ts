import { DatePipe } from '@angular/common'
import { MatChipsModule } from '@angular/material/chips'
import { AfterViewInit, Component, inject, input, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'

import { Interaction } from '../../interfaces/interaction.interface'
import { InteractionNotesDialogComponent } from '../interaction-notes-dialog/interaction-notes-dialog.component'
import { Topic } from "../../interfaces/interaction.interface"

@Component({
	selector: 'app-interaction-card-content',
	standalone: true,
	imports: [DatePipe, MatChipsModule],
	templateUrl: './interaction-card-content.component.html',
	styleUrl: './interaction-card-content.component.scss'
})
export class InteractionCardContentComponent implements AfterViewInit {
	readonly interaction = input.required<Interaction>()
	private readonly template = viewChild<TemplateRef<HTMLElement>>('template')
	private readonly dialog = inject(MatDialog)
	private readonly viewContainerRef = inject(ViewContainerRef)

	ngAfterViewInit(): void {
		this.viewContainerRef.createEmbeddedView(this.template()!)
		this.viewContainerRef.element.nativeElement.remove()
	}

	onTopicClick(topic: Topic): void {
		const dialogRef = this.dialog.open(InteractionNotesDialogComponent, { data: {
			topic: topic.topic,
			notes: topic.notes,
		}})
	}

}
