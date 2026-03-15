import { TestBed } from '@angular/core/testing'

import { Interactions } from './interactions'

describe('Interactions', () => {
	let service: Interactions

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(Interactions)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
