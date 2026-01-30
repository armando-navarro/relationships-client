import { inject, Injectable } from '@angular/core'
import { distinctUntilChanged, filter, fromEvent, map, merge, Observable, pairwise, startWith, throttleTime } from 'rxjs'
import { ResponsiveUiService } from './responsive-ui.service'

type ScrollDirection = 'up'|'down'
interface CanScrollHorizontally {
	canScrollLeft: boolean
	canScrollRight: boolean
}

@Injectable({ providedIn: 'root' })
export class ScrollService {
	private readonly responsiveUiService = inject(ResponsiveUiService)

	readonly scrollDirection$ = fromEvent(window, 'scroll').pipe(
		throttleTime(50),
		map(() => window.scrollY),
		filter(scrollY => scrollY >= 0),
		pairwise(),
		map<[number, number], ScrollDirection>(([ previousY, currentY ]) =>
			currentY > previousY ? 'down' : 'up'
		),
		distinctUntilChanged(),
	)

	/** @returns An object describing whether an element can scroll left or right. */
	getHorizontalScrollability(scrollable: HTMLElement): Observable<CanScrollHorizontally> {
		const resize$ = this.responsiveUiService.observeResize(scrollable)
		const scroll$ = fromEvent(scrollable, 'scroll')
		return merge(resize$, scroll$).pipe(
			throttleTime(75, undefined, { trailing: true }),
			startWith(null), // trigger initial calculation
			map(() => ({
				canScrollLeft: scrollable.scrollLeft > 0,
				// account for sub-pixel rendering by using Math.ceil, and also the scroll button width
				canScrollRight: Math.ceil(scrollable.scrollLeft) + scrollable.clientWidth < scrollable.scrollWidth - 20,
			})),
			distinctUntilChanged()
		)
	}

	/** Scrolls the scrollable element horizontally by the specified number of pixels.
	 * Negative values scroll left, positive values scroll right. */
	scrollHorizontally(scrollable: HTMLElement, scrollByPx: number): void {
		const scrollLeft = Math.ceil(scrollable.scrollLeft)
		const { clientWidth, scrollWidth } = scrollable

		// adjust scroll amount to not exceed scroll bounds, which is possible on mobile devices
		const scrollLeftAfterScroll = scrollLeft + scrollByPx
		if (scrollLeftAfterScroll < 0) scrollByPx = -scrollLeft
		if (scrollLeftAfterScroll + clientWidth > scrollWidth) {
			scrollByPx = scrollWidth - clientWidth - scrollLeft
		}

		scrollable.scrollBy({
			left: scrollByPx,
			behavior: 'smooth'
		})
	}

}
