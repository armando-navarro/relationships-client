import { SimpleDatePipe } from './simple-date.pipe'

describe('SimpleDatePipe', () => {
	it('create an instance', () => {
		const pipe = new SimpleDatePipe()
		expect(pipe).toBeTruthy()
	})
})
