import { TestBed } from '@angular/core/testing'

import { RelationshipMapper } from './relationship-mapper'

describe('RelationshipMapper', () => {
	let service: RelationshipMapper

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(RelationshipMapper)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
