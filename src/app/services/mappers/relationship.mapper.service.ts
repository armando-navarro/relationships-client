import { inject, Injectable } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { DateTime } from 'luxon'

import { InteractionMapperService } from './interaction.mapper.service'
import { MiscMapperService } from './misc.mapper.service'
import { AttentionNeededStatus,
	Relationship,
	RelationshipFormGroup,
	RelationshipPayload,
	RelationshipResponse,
	RelationshipsGroupedByStatus,
	RelationshipsGroupedByStatusResponse
} from '../../interfaces/relationship.interface'

@Injectable({ providedIn: 'root' })
export class RelationshipMapperService {
	private readonly fb = inject(FormBuilder)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly miscMapper = inject(MiscMapperService)

	mapResponseToModel(response: RelationshipResponse): Relationship
	mapResponseToModel(responses: RelationshipResponse[]): Relationship[]
	mapResponseToModel(responseOrArray: RelationshipResponse|RelationshipResponse[]): Relationship|Relationship[] {
		if (Array.isArray(responseOrArray)) {
			return responseOrArray.map(response => this.mapSingleResponseToModel(response))
		}
		return this.mapSingleResponseToModel(responseOrArray)
	}

	private mapSingleResponseToModel(response: RelationshipResponse): Relationship {
		let lastInteractionDate: Date|null = null
		let lastInteractionRelativeTime: string|null = null

		if (response.lastInteractionDate) {
			lastInteractionDate = new Date(response.lastInteractionDate)
			lastInteractionRelativeTime = DateTime.fromISO(response.lastInteractionDate).toRelativeCalendar()
		}
		return {
			...response,
			lastInteractionDate,
			lastInteractionRelativeTime,
			notes: this.miscMapper.convertNewlinesToLineBreaks(response.notes),
			interactions: this.interactionMapper.mapResponseToModel(response.interactions)
		}
	}

	mapGroupedByStatusResponseToModel(response: RelationshipsGroupedByStatusResponse): RelationshipsGroupedByStatus {
		const result: RelationshipsGroupedByStatus = {} as RelationshipsGroupedByStatus
		Object.entries(response).forEach(([status, groupResponse]) => {
			result[status as AttentionNeededStatus] = {
				...groupResponse,
				relationships: this.mapResponseToModel(groupResponse.relationships)
			}
		})
		return result
	}

	mapModelToForm(relationship?: Relationship) {
		const form = this.fb.group({
			_id: [relationship?._id ?? null],
			firstName: [relationship?.firstName ?? null, Validators.required],
			lastName: [relationship?.lastName ?? null],
			interactionRateGoal: [relationship?.interactionRateGoal ?? null],
			notes: [relationship?.notes ?? null],
			interactions: this.fb.array([
				this.interactionMapper.mapModelToForm()
			])
		})
		form.controls.interactions.clear()
		relationship?.interactions.forEach(interaction =>
			form.controls.interactions.push(this.interactionMapper.mapModelToForm(interaction))
		)
		return form
	}

	mapFormToPayload(form: RelationshipFormGroup): RelationshipPayload {
		return {
			_id: form.value._id ?? null,
			firstName: form.value.firstName!,
			lastName: form.value.lastName ?? null,
			interactionRateGoal: form.value.interactionRateGoal ?? null,
			notes: form.value.notes!,
			interactions: this.interactionMapper.mapFormValueToModel(form.value.interactions!)
		}
	}

}
