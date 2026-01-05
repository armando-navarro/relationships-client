import { Injectable } from '@angular/core'
import { distinctUntilChanged, filter, fromEvent, map, Observable, pairwise, startWith, throttleTime } from 'rxjs'

export type ScrollDirection = 'up'|'down'
export type ScrollPosition = 'min'|'between'|'max'|'no-overflow'

@Injectable({ providedIn: 'root' })
export class ScrollService {
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

	/** @returns A string describing whether an element's scroll position is at its min, max, between, or has no overflow. */
	getHorizontalScrollResult(scrollable: HTMLElement): Observable<ScrollPosition> {
		return fromEvent(scrollable, 'scroll').pipe(
			throttleTime(50, undefined, { trailing: true }),
			startWith(null), // trigger initial calculation
			map(() => {
				if (scrollable.scrollWidth <= scrollable.clientWidth) return 'no-overflow'
				if (scrollable.scrollLeft === 0) return 'min'
				if (scrollable.scrollLeft + scrollable.clientWidth >= scrollable.scrollWidth) return 'max'
				return 'between'
			}),
			distinctUntilChanged()
		)
	}

}
