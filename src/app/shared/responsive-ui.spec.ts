import { TestBed } from '@angular/core/testing'

import { ResponsiveUi } from './responsive-ui'

describe('ResponsiveUi', () => {
	let service: ResponsiveUi

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(ResponsiveUi)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
