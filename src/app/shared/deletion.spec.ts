import { TestBed } from '@angular/core/testing'

import { Deletion } from './deletion'

describe('Deletion', () => {
	let service: Deletion

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(Deletion)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
