import { Injectable } from '@angular/core'
import { debounceTime, fromEvent, map, startWith } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class ResponsiveUiService {
	// provide a continuous stream to observe viewport size changes
	readonly isSmallViewport$ = fromEvent(window, 'resize').pipe(
		startWith(this.isSmallViewport()),
		debounceTime(200),
		map(() => this.isSmallViewport())
	)

	// provide a method to check if the viewport is small when called
	isSmallViewport(): boolean {
		const smallBreakpoint = getComputedStyle(document.documentElement).getPropertyValue('--small-breakpoint')
		return window.innerWidth <= parseInt(smallBreakpoint, 10)
	}

}
