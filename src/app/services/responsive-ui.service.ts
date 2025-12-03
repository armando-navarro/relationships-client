import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ResponsiveUiService {

	isSmallViewport(): boolean {
		const smallBreakpoint = getComputedStyle(document.documentElement).getPropertyValue('--small-breakpoint')
		return window.innerWidth <= parseInt(smallBreakpoint, 10)
	}

}
