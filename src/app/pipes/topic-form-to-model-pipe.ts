import { inject, Pipe, PipeTransform } from '@angular/core'

import { InteractionMapper } from '../services/mappers/interaction-mapper'
import { InteractionTopicFormGroup, Topic } from '../interfaces/interaction-interface'

@Pipe({
	name: 'topicFormToModel',
	standalone: true
})
export class TopicFormToModelPipe implements PipeTransform {
	private readonly interactionMapper = inject(InteractionMapper)

	/** Map an interaction topic form group into a topic model. */
	transform(value: InteractionTopicFormGroup, ...args: unknown[]): Topic {
		return this.interactionMapper.mapTopicFormToModel(value)
	}

}
