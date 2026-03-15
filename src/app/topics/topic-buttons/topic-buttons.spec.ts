import { ComponentFixture, TestBed } from '@angular/core/testing'

import { TopicButtons } from './topic-buttons'

describe('TopicButtons', () => {
	let component: TopicButtons
	let fixture: ComponentFixture<TopicButtons>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TopicButtons]
		})
		.compileComponents()

		fixture = TestBed.createComponent(TopicButtons)
		component = fixture.componentInstance
		await fixture.whenStable()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
