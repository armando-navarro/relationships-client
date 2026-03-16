import { AfterContentInit, booleanAttribute, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core'
import { fromEvent, take } from 'rxjs'

@Component({
	selector: 'app-dynamic-scrollable',
	imports: [],
	templateUrl: './dynamic-scrollable.html',
	styleUrl: './dynamic-scrollable.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicScrollable implements AfterContentInit {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	private readonly svg = viewChild<ElementRef<SVGSVGElement>>('arrow')

	readonly scrollable = input(false, { transform: booleanAttribute })
	readonly isVisible = input(false, { alias: 'is-visible', transform: booleanAttribute })
	protected readonly showScrollArrow = signal(false)
	protected readonly animateArrow = computed(() => this.isVisible() && this.showScrollArrow())
	protected readonly animationCompleted = signal(false)

	constructor() {
		this.hideScrollArrowWhenAnimationCompletes()
	}

	/** Hide the scroll arrow after its attention-drawing animation finishes. */
	private hideScrollArrowWhenAnimationCompletes(): void {
		effect(() => {
			if (this.animateArrow() && !this.animationCompleted()) {
				fromEvent(this.svg()!.nativeElement!, 'animationend')
					.pipe(take(1))
					.subscribe(() => this.animationCompleted.set(true))
			}
		})
	}

	ngAfterContentInit(): void {
		this.setScrollArrowVisibility()
	}

	/** Checks if the host element's content is overflowing and updates the `showScrollArrow` signal accordingly. */
	private setScrollArrowVisibility(): void {
		if (!this.scrollable()) return

		const host = this.hostRef.nativeElement
		const isOverflowing = host.scrollHeight > host.clientHeight
		if (isOverflowing) host.classList.add('scrollable')

		this.showScrollArrow.set(isOverflowing)
	}

}
