import { TestBed } from '@angular/core/testing'

import { RelationshipUtilities } from './relationship-utilities'

describe('RelationshipUtilities', () => {
	let service: RelationshipUtilities

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(RelationshipUtilities)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
