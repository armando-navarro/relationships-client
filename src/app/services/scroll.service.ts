import { Injectable } from '@angular/core'
import { distinctUntilChanged, fromEvent, map, pairwise, throttleTime } from 'rxjs'

export type ScrollDirection = 'up'|'down'

@Injectable({ providedIn: 'root' })
export class ScrollService {
	scrollDirection$ = fromEvent(window, 'scroll').pipe(
		throttleTime(50),
		map(() => window.scrollY),
		pairwise(),
		map<[number, number], ScrollDirection>(([ previousY, currentY ]) =>
			currentY > previousY ? 'down' : 'up'
		),
		distinctUntilChanged(),
	)

}
