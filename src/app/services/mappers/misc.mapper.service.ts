import { inject, Injectable, SecurityContext } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'

@Injectable({ providedIn: 'root' })
export class MiscMapperService {
	private readonly sanitizer = inject(DomSanitizer)

	convertNewlinesToLineBreaks(notes: string): string {
		const sanitzedNotes = this.sanitizer.sanitize(SecurityContext.HTML, notes) ?? ''
		return sanitzedNotes.replaceAll('&#10;', '<br />').replaceAll('\n', '<br />')
	}

}
