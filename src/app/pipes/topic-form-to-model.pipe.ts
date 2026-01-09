import { inject, Pipe, PipeTransform } from '@angular/core'

import { InteractionMapperService } from '../services/mappers/interaction.mapper.service'
import { InteractionTopicFormGroup, Topic } from '../interfaces/interaction.interface'

@Pipe({
	name: 'topicFormToModel',
	standalone: true
})
export class TopicFormToModelPipe implements PipeTransform {
	private readonly interactionMapper = inject(InteractionMapperService)

	transform(value: InteractionTopicFormGroup, ...args: unknown[]): Topic {
		return this.interactionMapper.mapTopicFormToModel(value)
	}

}
