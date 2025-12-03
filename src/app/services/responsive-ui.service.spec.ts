import { TestBed } from '@angular/core/testing'

import { ResponsiveUiService } from './responsive-ui.service'

describe('ResponsiveUiService', () => {
	let service: ResponsiveUiService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(ResponsiveUiService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
