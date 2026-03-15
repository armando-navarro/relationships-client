import { inject, Injectable } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'

import AppValidators from '../../constants/input-validation-constants'
import {
	Interaction,
	InteractionFormGroup,
	InteractionFormGroupValue,
	InteractionPayload,
	InteractionResponse,
	InteractionTopicFormGroup,
	InteractionType,
	Topic
} from '../../interfaces/interaction-interface'

interface InteractionPayloadWithRelationshipId {
	payload: InteractionPayload
	relationshipId: string|null
}

@Injectable({ providedIn: 'root' })
export class InteractionMapper {
	private readonly fb = inject(FormBuilder)

	private readonly interactionTypeToIcon = new Map<InteractionType, string>([
		[InteractionType.Email, 'mail'],
		[InteractionType.InPerson, 'emoji_people'],
		[InteractionType.GameChat, 'sports_esports'],
		[InteractionType.PhoneCall, 'call'],
		[InteractionType.SocialMedia, 'share'],
		[InteractionType.PostalMail, 'local_post_office'],
		[InteractionType.Text, 'chat_bubble'],
		[InteractionType.VideoCall, 'videocam'],
		[InteractionType.VoiceMail, 'voicemail'],
		[InteractionType.Other, 'help']
	])

	/** Map one or more interaction API responses into `Interaction` models. */
	mapResponseToModel(response: InteractionResponse): Interaction
	mapResponseToModel(responses: InteractionResponse[]): Interaction[]
	mapResponseToModel(responseOrArray: InteractionResponse|InteractionResponse[]): Interaction|Interaction[] {
		if (Array.isArray(responseOrArray)) {
			return responseOrArray.map(response => this.mapSingleResponseToModel(response))
		}
		return this.mapSingleResponseToModel(responseOrArray)
	}

	/** Map a single interaction API response into an `Interaction` model. */
	private mapSingleResponseToModel(response: InteractionResponse): Interaction {
		return {
			...response,
			date: new Date(response.date),
			typeIcon: this.interactionTypeToIcon.get(response.type)!,
			topics: response.topics
		}
	}

	/** Build an interaction form from an `Interaction` model or sensible defaults for a new interaction. */
	mapModelToForm(interaction?: Interaction, relationshipId?: string, personName?: string) {
		const form = this.fb.group({
			_id: [interaction?._id ?? null],
			type: [interaction?.type ?? null, { validators: [Validators.required] }],
			date: [interaction?.date ?? null, { validators: [Validators.required] }],
			topics: this.fb.array([
				this.mapTopicModelToForm()
			]),
			idOfRelationship: this.fb.control<string|null>(
				(interaction?.idOfRelationship || relationshipId) ?? null, Validators.required
			),
			nameOfPerson: this.fb.control<string|null>(
				(interaction?.nameOfPerson || personName) ?? null, Validators.required
			)
		})
		form.controls.topics.clear()
		if (interaction?.topics.length) {
			interaction.topics.forEach(topic => {
				form.controls.topics.push(this.mapTopicModelToForm(topic))
			})
		}
		return form
	}

	/** Build a topic form group from an existing `Topic` model or empty defaults. */
	mapTopicModelToForm(topic?: Topic) {
		return this.fb.group({
			name: [topic?.name ?? null, AppValidators.topicName],
			notes: [topic?.notes ?? '', AppValidators.notes],
		})
	}

	/** Map a topic form group into a trimmed `Topic` model. */
	mapTopicFormToModel(topicForm: InteractionTopicFormGroup): Topic {
		return {
			name: (topicForm.value.name ?? '').trim(),
			notes: (topicForm.value.notes ?? '').trim(),
		}
	}

	/** Map one or more interaction form values into `Interaction` models. */
	mapFormValueToModel(formValue: InteractionFormGroupValue): Interaction
	mapFormValueToModel(formValues: InteractionFormGroupValue[]): Interaction[]
	mapFormValueToModel(formValueOrArray: InteractionFormGroupValue|InteractionFormGroupValue[]): Interaction|Interaction[] {
		if (Array.isArray(formValueOrArray)) {
			return formValueOrArray.map(formValue => this.mapSingleFormValueToModel(formValue))
		}
		return this.mapSingleFormValueToModel(formValueOrArray)
	}

	/** Map a single interaction form value into an `Interaction` model. */
	private mapSingleFormValueToModel(formValue: InteractionFormGroupValue): Interaction {
		const interaction: Interaction = {
			_id: formValue._id ?? null,
			type: formValue.type ?? null,
			typeIcon: this.interactionTypeToIcon.get(formValue.type!) ?? '',
			date: formValue.date ?? null,
			topics: (formValue.topics ?? []).map(topic => ({
				name: topic.name ?? '',
				notes: topic.notes ?? '',
			}))
		}
		if (formValue.idOfRelationship) interaction.idOfRelationship = formValue.idOfRelationship
		if (formValue.nameOfPerson) interaction.nameOfPerson = formValue.nameOfPerson
		return interaction
	}

	/** Map an interaction form group into an `Interaction` model, filling relationship metadata when needed. */
	mapFormToModel(form: InteractionFormGroup, relationshipId?: string, personName?: string): Interaction {
		const interaction: Interaction = {
			_id: form.value._id ?? null,
			type: form.value.type ?? null,
			typeIcon: this.interactionTypeToIcon.get(form.value.type!) ?? '',
			date: form.value.date ?? null,
			topics: (form.value.topics ?? []).map(topic => ({
				name: topic.name ?? '',
				notes: topic.notes ?? '',
			})),
		}
		if (form.value.idOfRelationship) interaction.idOfRelationship = form.value.idOfRelationship
		else if (relationshipId) interaction.idOfRelationship = relationshipId

		if (form.value.nameOfPerson) interaction.nameOfPerson = form.value.nameOfPerson
		else if (personName) interaction.nameOfPerson = personName

		return interaction
	}

	/** Map an interaction form into the payload expected by the API. */
	mapFormToPayload(form: InteractionFormGroup): InteractionPayload {
		return {
			_id: form.value._id ?? null,
			type: form.value.type!,
			date: form.value.date!,
			topics: form.value.topics!.map(topic => ({
				name: topic.name!,
				notes: topic.notes!,
			}))
		}
	}

	/** Maps an interaction form to an API payload and the relationship ID used in the endpoint path. */
	mapFormToPayloadWithRelationshipId(form: InteractionFormGroup): InteractionPayloadWithRelationshipId {
		const payload = this.mapFormToPayload(form)
		return { payload, relationshipId: form.value.idOfRelationship ?? null }
	}

}
