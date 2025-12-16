import { TestBed } from '@angular/core/testing'

import { RelationshipMapperService } from './relationship.mapper.service'

describe('RelationshipMapperService', () => {
	let service: RelationshipMapperService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(RelationshipMapperService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
