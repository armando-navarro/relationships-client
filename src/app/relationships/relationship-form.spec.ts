import { TestBed } from '@angular/core/testing'

import { RelationshipForm } from './relationship-form'

describe('RelationshipForm', () => {
	let service: RelationshipForm

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(RelationshipForm)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
