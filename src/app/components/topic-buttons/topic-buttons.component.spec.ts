import { ComponentFixture, TestBed } from '@angular/core/testing'

import { TopicButtonsComponent } from './topic-buttons.component'

describe('TopicButtonsComponent', () => {
	let component: TopicButtonsComponent
	let fixture: ComponentFixture<TopicButtonsComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TopicButtonsComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(TopicButtonsComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
