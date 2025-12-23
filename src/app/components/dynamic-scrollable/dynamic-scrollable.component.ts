import { AfterContentInit, booleanAttribute, Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core'
import { NgStyle } from '@angular/common'
import { fromEvent, take } from 'rxjs'

@Component({
	selector: 'app-dynamic-scrollable',
	standalone: true,
	imports: [NgStyle],
	templateUrl: './dynamic-scrollable.component.html',
	styleUrl: './dynamic-scrollable.component.scss'
})
export class DynamicScrollableComponent implements AfterContentInit {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	private readonly svg = viewChild<ElementRef<SVGSVGElement>>('arrow')

	readonly scrollable = input(false, { transform: booleanAttribute })
	readonly isVisible = input(false, { alias: 'is-visible', transform: booleanAttribute })
	readonly isOverflowing = signal(false)
	readonly animateArrow = computed(() => this.isVisible() && this.isOverflowing())
	readonly animationCompleted = signal(false)
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
