import { TestBed } from '@angular/core/testing'

import { RelationshipFormService } from './relationship-form.service'

describe('RelationshipFormService', () => {
	let service: RelationshipFormService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(RelationshipFormService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
