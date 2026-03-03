import { AfterViewInit, Component, inject, input, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'

import { NewlinesToBrPipe } from "../../pipes/newlines-to-br.pipe"
import { Relationship } from '../../interfaces/relationship.interface'
import { SimpleDatePipe } from '../../pipes/simple-date.pipe'

@Component({
	selector: 'app-relationship-card-content',
	standalone: true,
	imports: [NewlinesToBrPipe, SimpleDatePipe],
	templateUrl: './relationship-card-content.component.html',
	styleUrl: './relationship-card-content.component.scss'
})
export class RelationshipCardContentComponent implements AfterViewInit {
	readonly relationship = input.required<Relationship>()

	private readonly template = viewChild<TemplateRef<HTMLElement>>('template')
	private readonly viewContainerRef = inject(ViewContainerRef)

	ngAfterViewInit(): void {
		this.viewContainerRef.createEmbeddedView(this.template()!)
		this.viewContainerRef.element.nativeElement.remove()
	}

}
