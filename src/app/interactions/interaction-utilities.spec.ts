import { TestBed } from '@angular/core/testing'

import { InteractionUtilities } from './interaction-utilities'

describe('InteractionUtilities', () => {
	let service: InteractionUtilities

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(InteractionUtilities)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
