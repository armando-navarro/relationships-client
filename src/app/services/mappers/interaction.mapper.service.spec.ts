import { TestBed } from '@angular/core/testing'

import { InteractionMapperService } from './interaction.mapper.service'

describe('InteractionMapperService', () => {
	let service: InteractionMapperService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(InteractionMapperService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
