import { DatePipe } from '@angular/common'
import { AfterViewInit, Component, inject, input, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'

import { MatIconModule } from '@angular/material/icon'

import { Interaction } from '../../interfaces/interaction.interface'
import { TopicButtonsComponent } from "../topic-buttons/topic-buttons.component"

@Component({
	selector: 'app-interaction-card-content',
	standalone: true,
	imports: [DatePipe, MatIconModule, TopicButtonsComponent],
	templateUrl: './interaction-card-content.component.html',
	styleUrl: './interaction-card-content.component.scss'
})
export class InteractionCardContentComponent implements AfterViewInit {
	private readonly viewContainerRef = inject(ViewContainerRef)

	readonly interaction = input.required<Interaction>()
	private readonly contentTemplate = viewChild<TemplateRef<HTMLElement>>('content')

	ngAfterViewInit(): void {
		this.viewContainerRef.createEmbeddedView(this.contentTemplate()!)
		this.viewContainerRef.element.nativeElement.remove()
	}

}
