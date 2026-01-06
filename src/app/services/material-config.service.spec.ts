import { TestBed } from '@angular/core/testing'

import { MaterialConfigService } from './material-config.service'

describe('MaterialConfigService', () => {
	let service: MaterialConfigService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(MaterialConfigService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
