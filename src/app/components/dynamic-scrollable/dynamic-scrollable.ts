import { AfterContentInit, booleanAttribute, Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core'
import { fromEvent, take } from 'rxjs'

@Component({
	selector: 'app-dynamic-scrollable',
	imports: [],
	templateUrl: './dynamic-scrollable.html',
	styleUrl: './dynamic-scrollable.scss'
})
export class DynamicScrollable implements AfterContentInit {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	private readonly svg = viewChild<ElementRef<SVGSVGElement>>('arrow')

	readonly scrollable = input(false, { transform: booleanAttribute })
	readonly isVisible = input(false, { alias: 'is-visible', transform: booleanAttribute })
	protected readonly isOverflowing = signal(false)
	protected readonly animateArrow = computed(() => this.isVisible() && this.isOverflowing())
	protected readonly animationCompleted = signal(false)
	private readonly keepArrowHidden = effect(() => {
		if (this.animateArrow() && !this.animationCompleted()) {
			fromEvent(this.svg()!.nativeElement!, 'animationend')
				.pipe(take(1))
				.subscribe(() => this.animationCompleted.set(true))
		}
	})

	ngAfterContentInit(): void {
		if (!this.scrollable()) return

		const host = this.hostRef.nativeElement
		const isOverflowing = host.scrollHeight > host.clientHeight
		if (isOverflowing) host.classList.add('scrollable')

		this.isOverflowing.set(isOverflowing)
	}

}
