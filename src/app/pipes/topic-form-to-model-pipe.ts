import { inject, Pipe, PipeTransform } from '@angular/core'

import { InteractionMapper } from '../services/mappers/interaction-mapper'
import { InteractionTopicFormGroup, Topic } from '../interfaces/interaction-interface'

@Pipe({
	name: 'topicFormToModel',
	standalone: true
})
export class TopicFormToModelPipe implements PipeTransform {
	private readonly interactionMapper = inject(InteractionMapper)

	transform(value: InteractionTopicFormGroup, ...args: unknown[]): Topic {
		return this.interactionMapper.mapTopicFormToModel(value)
	}

}
