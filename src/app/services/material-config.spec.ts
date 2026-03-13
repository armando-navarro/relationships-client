import { TestBed } from '@angular/core/testing'

import { MaterialConfig } from './material-config'

describe('MaterialConfig', () => {
	let service: MaterialConfig

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(MaterialConfig)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
