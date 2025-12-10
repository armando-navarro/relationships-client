import { Injectable } from '@angular/core'
import { distinctUntilChanged, filter, fromEvent, map, pairwise, throttleTime } from 'rxjs'

export type ScrollDirection = 'up'|'down'

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

}
