import { TestBed } from '@angular/core/testing'

import { RelationshipsService } from './relationships.service'

describe('RelationshipsService', () => {
	let service: RelationshipsService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(RelationshipsService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
