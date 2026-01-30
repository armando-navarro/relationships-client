import { computed, DestroyRef, inject, Injectable, signal, Signal } from '@angular/core'
import { Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class ResponsiveUiService {
	private readonly destroyRef = inject(DestroyRef)
	private readonly smallBreakpoint = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--small-breakpoint'), 10)
	readonly pageHeaderBarHeight = computed(() => this.isSmallViewport() ? this.smallHeaderBarHeight : this.largeHeaderBarHeight)

	/** A signal that stays updated with the current viewport size. */
	readonly isSmallViewport = this.createBreakpointMediaQuerySignal(this.smallBreakpoint, 'max', this.destroyRef)

	/** Creates a new ResizeObserver and converts it to an Observable. */
	observeResize(element: HTMLElement): Observable<ResizeObserverEntry[]> {
		return new Observable(observer => {
			const resizeObserver = new ResizeObserver(entries => observer.next(entries))
			resizeObserver.observe(element)
			return () => resizeObserver.disconnect()
		})
	}

	/** @returns A boolean signal that indicates whether or not the viewport
	 * width matches the min/max-width media query at `breakpoint`. */
	createBreakpointMediaQuerySignal(breakpoint: number, limit: 'min'|'max', destroyRef: DestroyRef): Signal<boolean> {
		const mediaQueryList = window.matchMedia(`(${limit}-width: ${breakpoint}px)`)
		const mediaQuerySignal = signal(mediaQueryList.matches)
		const updateSignal = ({ matches }: MediaQueryListEvent) => mediaQuerySignal.set(matches)
		mediaQueryList.addEventListener('change', updateSignal)
		destroyRef.onDestroy(() => mediaQueryList.removeEventListener('change', updateSignal))
		return mediaQuerySignal
	}

	private get smallHeaderBarHeight(): number {
		return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--page-small-header-bar-height'), 10)
	}

	private get largeHeaderBarHeight(): number {
		return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--page-large-header-bar-height'), 10)
	}

}
