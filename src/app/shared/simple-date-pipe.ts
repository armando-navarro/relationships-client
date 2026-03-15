import { Pipe, PipeTransform } from '@angular/core'
import { DateTime } from 'luxon'

@Pipe({
	name: 'simpleDate',
	standalone: true
})
export class SimpleDatePipe implements PipeTransform {

	/** Format dates with relative text for recent values and absolute text for older ones. */
	transform(value: Date|null|undefined, ...args: unknown[]): string {
		if (!value) return 'N/A'

		const date = DateTime.fromJSDate(value)

		// use 'days ago' wording for dates within the last week
		const sixDaysAgo = DateTime.now().minus({ days: 6 }).startOf('day')
		if (date >= sixDaysAgo) return date.toRelativeCalendar({ unit: 'days' })!

		// use 'weeks ago' wording for dates within the last three weeks
		const threeWeeksAgo = DateTime.now().minus({ weeks: 3 }).startOf('day')
		if (date >= threeWeeksAgo) return date.toRelativeCalendar({ unit: 'weeks' })!

		// use short month and day for dates within the last year
		const oneYearAgo = DateTime.now().minus({ years: 1 }).startOf('day')
		if (date >= oneYearAgo) return date.toFormat('LLL d')

		// use full date for older dates
		return date.toFormat('LLL d, yyyy')
	}

}
