import { TestBed } from '@angular/core/testing'

import { RelationshipUtilitiesService } from './relationship-utilities.service'

describe('RelationshipUtilitiesService', () => {
	let service: RelationshipUtilitiesService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(RelationshipUtilitiesService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
