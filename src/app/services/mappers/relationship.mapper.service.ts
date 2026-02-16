import { inject, Injectable } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { DateTime } from 'luxon'

import AppValidators from '../../constants/input-validation.constants'
import { InteractionMapperService } from './interaction.mapper.service'
import { AttentionNeededStatus,
	RelationshipDerivedProperties,
	Relationship,
	RelationshipDerivedPropertiesResponse,
	RelationshipFormGroup,
	RelationshipPayload,
	RelationshipResponse,
	RelationshipsGroupedByStatusResponse,
	RelationshipGroup,
} from '../../interfaces/relationship.interface'
import { RelationshipUtilitiesService } from '../relationship-utilities.service'

@Injectable({ providedIn: 'root' })
export class RelationshipMapperService {
	private readonly fb = inject(FormBuilder)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly relationshipUtils = inject(RelationshipUtilitiesService)

	mapResponseToModel(response: RelationshipResponse): Relationship
	mapResponseToModel(responses: RelationshipResponse[]): Relationship[]
	mapResponseToModel(responseOrArray: RelationshipResponse|RelationshipResponse[]): Relationship|Relationship[] {
		if (Array.isArray(responseOrArray)) {
			return responseOrArray.map(response => this.mapSingleResponseToModel(response))
		}
		return this.mapSingleResponseToModel(responseOrArray)
	}

	private mapSingleResponseToModel(response: RelationshipResponse): Relationship {
		const partialRelationship = this.mapPartialResponseToModel(response)
		return {
			_id: response._id,
			firstName: response.firstName,
			lastName: response.lastName,
			fullName: response.fullName,
			interactionRateGoal: response.interactionRateGoal,
			daysUntilAttentionNeeded: response.daysUntilAttentionNeeded,
			...partialRelationship,
			notes: response.notes,
			interactions: this.interactionMapper.mapResponseToModel(response.interactions)
		}
	}

	mapPartialResponseToModel(response: RelationshipDerivedPropertiesResponse): RelationshipDerivedProperties {
		let lastInteractionDate: Date|null = null
		let lastInteractionRelativeTime: string|null = null

		if (response.lastInteractionDate) {
			lastInteractionDate = new Date(response.lastInteractionDate)
			lastInteractionRelativeTime = DateTime.fromISO(response.lastInteractionDate).toRelativeCalendar()
		}
		return  {
			lastInteractionDate,
			lastInteractionRelativeTime,
			daysUntilAttentionNeeded: response.daysUntilAttentionNeeded,
			attentionNeededText: response.attentionNeededText,
			attentionNeededStatus: response.attentionNeededStatus,
			attentionStatusColor: response.attentionStatusColor,
		}
	}

	/** Maps a relationships grouping API response to a RelationshipGroup array ordered by attention needed status. */
	mapGroupedByStatusResponseToModel(response: RelationshipsGroupedByStatusResponse): RelationshipGroup[] {
		const statusToGroupMap = new Map<AttentionNeededStatus, RelationshipGroup>()

		Object.entries(response).forEach(([status, groupResponse]) => {
			const group = statusToGroupMap.get(status as AttentionNeededStatus) ?? {
				...groupResponse,
				relationships: this.mapResponseToModel(groupResponse.relationships)
			}
			statusToGroupMap.set(status as AttentionNeededStatus, group)
		})

		return this.relationshipUtils.orderRelationshipGroups(statusToGroupMap)
	}

	/** Takes a Relationship model and maps it to a RelationshipFormGroup,
	 * or creates an empty RelationshipFormGroup if no relationship is provided. */
	mapModelToForm(relationship?: Relationship) {
		const form = this.fb.group({
			_id: [relationship?._id ?? null],
			firstName: [relationship?.firstName ?? null, [Validators.required, AppValidators.relationshipNamePart]],
			lastName: [relationship?.lastName ?? null, AppValidators.relationshipNamePart],
			interactionRateGoal: [relationship?.interactionRateGoal ?? null],
			notes: [relationship?.notes ?? null, AppValidators.notes],
			interactions: this.fb.array([
				// empty interaction added for typing purposes - it's removed on the next line
				this.interactionMapper.mapModelToForm(undefined, relationship?._id ?? undefined, relationship?.fullName)
			])
		})
		form.controls.interactions.clear()
		relationship?.interactions.forEach(interaction =>
			form.controls.interactions.push(this.interactionMapper.mapModelToForm(interaction, relationship?._id ?? undefined, relationship?.fullName))
		)
		return form
	}

	mapFormToModel(form: RelationshipFormGroup): Relationship {
		const fullName = `${form.value.firstName!} ${form.value.lastName ?? ''}`
		return {
			_id: form.value._id ?? null,
			firstName: form.value.firstName!,
			lastName: form.value.lastName ?? null,
			interactionRateGoal: form.value.interactionRateGoal ?? null,
			notes: form.value.notes!,
			fullName,
			interactions: form.controls.interactions.controls.map(control =>
				this.interactionMapper.mapFormToModel(control, form.value._id!, fullName)
			)
		}
	}

	mapFormToPayload(form: RelationshipFormGroup): RelationshipPayload {
		return {
			_id: form.value._id ?? null,
			firstName: form.value.firstName!,
			lastName: form.value.lastName ?? null,
			interactionRateGoal: form.value.interactionRateGoal ?? null,
			notes: form.value.notes!,
			interactions: form.controls.interactions.controls.map(control =>
				this.interactionMapper.mapFormToPayload(control)
			)
		}
	}

}
