import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'

import { NewlinesToBrPipe } from '../../shared/newlines-to-br-pipe'
import { Relationship } from '../relationship-interface'
import { SimpleDatePipe } from '../../shared/simple-date-pipe'

@Component({
	selector: 'app-relationship-card-content',
	imports: [NewlinesToBrPipe, SimpleDatePipe],
	templateUrl: './relationship-card-content.html',
	styleUrl: './relationship-card-content.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipCardContent implements AfterViewInit {
	readonly relationship = input.required<Relationship>()

	private readonly template = viewChild<TemplateRef<HTMLElement>>('template')
	private readonly viewContainerRef = inject(ViewContainerRef)

	ngAfterViewInit(): void {
		// render the content template into the parent container and remove this wrapper element
		this.viewContainerRef.createEmbeddedView(this.template()!)
		this.viewContainerRef.element.nativeElement.remove()
	}

}
