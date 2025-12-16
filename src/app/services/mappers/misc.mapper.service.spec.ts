import { TestBed } from '@angular/core/testing'

import { MiscMapperService } from './misc.mapper.service'

describe('MiscMapperService', () => {
	let service: MiscMapperService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(MiscMapperService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
