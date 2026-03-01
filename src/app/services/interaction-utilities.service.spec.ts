import { TestBed } from '@angular/core/testing'

import { InteractionUtilitiesService } from './interaction-utilities.service'

describe('InteractionUtilitiesService', () => {
	let service: InteractionUtilitiesService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(InteractionUtilitiesService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
