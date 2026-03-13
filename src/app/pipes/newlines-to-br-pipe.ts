import { inject, Pipe, PipeTransform, SecurityContext } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'

@Pipe({
	name: 'newlinesToBr',
	standalone: true
})
export class NewlinesToBrPipe implements PipeTransform {
	private readonly sanitizer = inject(DomSanitizer)

	transform(value: string|null|undefined, ...args: unknown[]): string {
		value = value ?? ''
		const sanitzedNotes = this.sanitizer.sanitize(SecurityContext.HTML, value) ?? ''
		return sanitzedNotes.replaceAll('&#10;', '<br />').replaceAll('\n', '<br />')
	}

}
