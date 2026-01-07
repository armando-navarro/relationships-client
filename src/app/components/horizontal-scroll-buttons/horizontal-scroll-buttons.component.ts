import { AfterViewInit, booleanAttribute, Component, computed, inject, input, OnDestroy, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'

import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { ScrollPosition, ScrollService } from '../../services/scroll.service'

@Component({
	selector: 'app-horizontal-scroll-buttons',
	standalone: true,
	imports: [MatIconModule, MatTooltipModule],
	templateUrl: './horizontal-scroll-buttons.component.html',
	styleUrl: './horizontal-scroll-buttons.component.scss'
})
export class HorizontalScrollButtonsComponent implements AfterViewInit, OnDestroy {
	// services
	private readonly viewContainerRef = inject(ViewContainerRef)
	private readonly scrollService = inject(ScrollService)
	// inputs: primary
	readonly scrollableElement = input.required<HTMLElement>()
	readonly hideButtons = input<boolean>(false, { alias: 'hide-buttons' })
	readonly scrollAmountPx = input(600, { alias: 'scroll-amount-px' }) // default value used for card groups
	// inputs: positioning & styling
	readonly buttonTopPx = input(49, { alias: 'button-top-px' }) // default value used for card groups
	readonly buttonXPx = input(0, { alias: 'button-x-px' })
	readonly buttonBottomPx = input(0, { alias: 'button-bottom-px' })
	readonly noOpacity = input(false, { alias: 'no-opacity', transform: booleanAttribute })
	// queries
	private readonly buttonsTemplate = viewChild.required<TemplateRef<HTMLElement>>('buttons')
	// state
	private readonly scrollPosition = signal<ScrollPosition>('no-overflow')
	readonly hideLeftScrollButton = computed(() => (
		this.hideButtons() || this.scrollPosition() === 'min' || this.scrollPosition() === 'no-overflow'
	))
	readonly hideRightScrollButton = computed(() => (
		this.hideButtons() || this.scrollPosition() === 'max' || this.scrollPosition() === 'no-overflow'
	))
	private readonly destroy$ = new Subject<void>()

	ngAfterViewInit(): void {
		const hostElement = this.viewContainerRef.element.nativeElement as HTMLElement

		hostElement.parentElement!.style.position = 'relative'
		this.viewContainerRef.createEmbeddedView(this.buttonsTemplate())
		hostElement.remove()

		this.scrollService.getHorizontalScrollResult(this.scrollableElement()).pipe(
			takeUntil(this.destroy$),
		).subscribe(result => this.scrollPosition.set(result))
	}

	onScrollButtonClick(direction: 'left' | 'right'): void {
		let scrollBy = direction === 'left' ? -this.scrollAmountPx() : this.scrollAmountPx()

		// adjust scrollBy to not exceed scroll bounds, which is possible on mobile devices
		const endingScrollLeft = this.scrollableElement().scrollLeft + scrollBy
		if (endingScrollLeft < 0) scrollBy = -this.scrollableElement().scrollLeft
		if (endingScrollLeft + this.scrollableElement().clientWidth > this.scrollableElement().scrollWidth) {
			scrollBy = this.scrollableElement().scrollWidth - this.scrollableElement().clientWidth - this.scrollableElement().scrollLeft
		}

		this.scrollableElement()?.scrollBy({
			left: scrollBy,
			behavior: 'smooth'
		})
	}

	ngOnDestroy(): void {
		this.destroy$.next()
		this.destroy$.complete()
	}
}
