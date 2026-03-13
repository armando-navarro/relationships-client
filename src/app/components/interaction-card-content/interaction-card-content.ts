import { DatePipe } from '@angular/common'
import { AfterViewInit, Component, inject, input, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'

import { MatIconModule } from '@angular/material/icon'

import { Interaction } from '../../interfaces/interaction-interface'
import { TopicButtons } from '../topic-buttons/topic-buttons'

@Component({
	selector: 'app-interaction-card-content',
	imports: [DatePipe, MatIconModule, TopicButtons],
	templateUrl: './interaction-card-content.html',
	styleUrl: './interaction-card-content.scss'
})
export class InteractionCardContent implements AfterViewInit {
	private readonly viewContainerRef = inject(ViewContainerRef)

	readonly interaction = input.required<Interaction>()
	private readonly contentTemplate = viewChild<TemplateRef<HTMLElement>>('content')

	ngAfterViewInit(): void {
		this.viewContainerRef.createEmbeddedView(this.contentTemplate()!)
		this.viewContainerRef.element.nativeElement.remove()
	}

}
