import { TestBed } from '@angular/core/testing'

import { InteractionMapper } from './interaction-mapper'

describe('InteractionMapper', () => {
	let service: InteractionMapper

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(InteractionMapper)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
