import { Pipe, PipeTransform } from '@angular/core'
import { DateTime } from 'luxon'

@Pipe({
	name: 'simpleDate',
	standalone: true
})
export class SimpleDatePipe implements PipeTransform {

	transform(value: Date, ...args: unknown[]): string {
		const date = DateTime.fromJSDate(value)

		// use relative wording for dates within the last week
		const sixDaysAgo = DateTime.now().minus({ days: 6 }).startOf('day')
		if (date >= sixDaysAgo) return date.toRelativeCalendar()!

		// use short month and day for dates within the last year
		const oneYearAgo = DateTime.now().minus({ years: 1 }).startOf('day')
		if (date >= oneYearAgo) return date.toFormat('LLL d')

		// use full date for older dates
		return date.toFormat('LLL d, yyyy')
	}

}
