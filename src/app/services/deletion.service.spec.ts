import { TestBed } from '@angular/core/testing'

import { DeletionService } from './deletion.service'

describe('DeletionService', () => {
	let service: DeletionService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(DeletionService)
	})

	it('should be created', () => {
		expect(service).toBeTruthy()
	})
})
