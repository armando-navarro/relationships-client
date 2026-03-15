import { TestBed } from '@angular/core/testing'

import { Relationships } from './relationships'

describe('Relationships', () => {
	let service: Relationships

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(Relationships)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
