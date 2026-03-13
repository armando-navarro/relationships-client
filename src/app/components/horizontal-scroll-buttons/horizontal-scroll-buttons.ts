import { AfterViewInit, booleanAttribute, Component, inject, input, model, OnDestroy, Renderer2, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'

import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { Scroll } from '../../services/scroll'

@Component({
	selector: 'app-horizontal-scroll-buttons',
	imports: [MatIconModule, MatTooltipModule],
	templateUrl: './horizontal-scroll-buttons.html',
	styleUrl: './horizontal-scroll-buttons.scss'
})
export class HorizontalScrollButtons implements AfterViewInit, OnDestroy {
	// injections
	private readonly viewContainerRef = inject(ViewContainerRef)
	private readonly renderer = inject(Renderer2)
	private readonly scroll = inject(Scroll)
	// inputs: primary
	readonly scrollableElement = model<HTMLElement>()
	readonly hideButtons = input<boolean>(false, { alias: 'hide-buttons' })
	readonly scrollAmountPx = input(200, { alias: 'scroll-amount-px' }) // default value used topic buttons component
	// inputs: positioning & styling
	readonly noOpacity = input(false, { alias: 'no-opacity', transform: booleanAttribute })
	// queries
	private readonly leftButtonTemplate = viewChild.required<TemplateRef<HTMLElement>>('leftButton')
	private readonly rightButtonTemplate = viewChild.required<TemplateRef<HTMLElement>>('rightButton')
	// state
	protected readonly canScrollLeft = signal(false)
	protected readonly canScrollRight = signal(false)

	private readonly destroy$ = new Subject<void>()

	ngAfterViewInit(): void {
		const hostElement = this.viewContainerRef.element.nativeElement as HTMLElement

		// default to parent element if no scrollable or button container element provided
		if (!this.scrollableElement()) this.scrollableElement.set(hostElement.parentElement!)

		// unwrap template from host element by moving its content to the parent element and removing the host element
		this.insertButtonsIntoContainer()
		hostElement.remove()

		// setup the properties that control scroll button visibility
		this.scroll.getHorizontalScrollability(this.scrollableElement()!).pipe(
			takeUntil(this.destroy$),
		).subscribe(({ canScrollLeft, canScrollRight }) => {
			this.canScrollLeft.set(canScrollLeft && !this.hideButtons())
			this.canScrollRight.set(canScrollRight && !this.hideButtons())
		})
	}

	private insertButtonsIntoContainer(): void {
		const container = this.scrollableElement()!
		const leftButtonView = this.viewContainerRef.createEmbeddedView(this.leftButtonTemplate())
		const rightButtonView = this.viewContainerRef.createEmbeddedView(this.rightButtonTemplate())

		// insert left button as first child and right button as last child
		leftButtonView.rootNodes.forEach(node => this.renderer.insertBefore(container, node, container.firstChild))
		rightButtonView.rootNodes.forEach(node => this.renderer.appendChild(container, node))
	}

	/** Scrolls the scrollable element left or right by the amount specified in `this.scrollAmountPx`. */
	protected scrollHorizontally(direction: 'left' | 'right'): void {
		let scrollByPx = direction === 'left' ? -this.scrollAmountPx() : this.scrollAmountPx()
		this.scroll.scrollHorizontally(this.scrollableElement()!, scrollByPx)
	}

	ngOnDestroy(): void {
		this.destroy$.next()
		this.destroy$.complete()
	}
}
