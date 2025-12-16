import { inject, Injectable } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'

import {
	Interaction,
	InteractionFormGroup,
	InteractionFormGroupValue,
	InteractionPayload,
	InteractionResponse,
	Topic
} from '../../interfaces/interaction.interface'
import { MiscMapperService } from './misc.mapper.service'

interface InteractionPayloadWithRelationshipId {
	payload: InteractionPayload
	relationshipId: string|null
}

@Injectable({ providedIn: 'root' })
export class InteractionMapperService {
	private readonly fb = inject(FormBuilder)
	private readonly miscMapper = inject(MiscMapperService)

	mapResponseToModel(response: InteractionResponse): Interaction
	mapResponseToModel(responses: InteractionResponse[]): Interaction[]
	mapResponseToModel(responseOrArray: InteractionResponse|InteractionResponse[]): Interaction|Interaction[] {
		if (Array.isArray(responseOrArray)) {
			return responseOrArray.map(response => this.mapSingleResponseToModel(response))
		}
		return this.mapSingleResponseToModel(responseOrArray)
	}

	private mapSingleResponseToModel(response: InteractionResponse): Interaction {
		return {
			...response,
			date: new Date(response.date),
			topicsDiscussed: response.topicsDiscussed.map(topic => ({
				...topic,
				notes: this.miscMapper.convertNewlinesToLineBreaks(topic.notes)
			}))
		}
	}

	mapModelToForm(interaction?: Interaction) {
		const form = this.fb.group({
			_id: [interaction?._id ?? null],
			type: [interaction?.type ?? null, { validators: [Validators.required] }],
			date: [interaction?.date ?? null],
			topicsDiscussed: this.fb.array([
				this.mapTopicsModelToForm()
			]),
			idOfRelationship: this.fb.control<string|null>(interaction?.idOfRelationship ?? null, Validators.required),
			nameOfPerson: this.fb.control<string|null>(interaction?.nameOfPerson ?? null, Validators.required,)
		})
		if (interaction?.topicsDiscussed.length) {
			form.controls.topicsDiscussed.clear()
			interaction.topicsDiscussed.forEach(topic => {
				form.controls.topicsDiscussed.push(this.mapTopicsModelToForm(topic))
			})
		}
		return form
	}

	mapTopicsModelToForm(topicsDiscussed?: Topic) {
		return this.fb.group({
			topic: [topicsDiscussed?.topic ?? null, Validators.required],
			notes: [topicsDiscussed?.notes ?? null, Validators.required]
		})
	}

	mapFormValueToModel(formValue: InteractionFormGroupValue): Interaction
	mapFormValueToModel(formValues: InteractionFormGroupValue[]): Interaction[]
	mapFormValueToModel(formValueOrArray: InteractionFormGroupValue|InteractionFormGroupValue[]): Interaction|Interaction[] {
		if (Array.isArray(formValueOrArray)) {
			return formValueOrArray.map(formValue => this.mapSingleFormValueToModel(formValue))
		}
		return this.mapSingleFormValueToModel(formValueOrArray)
	}

	private mapSingleFormValueToModel(formValue: InteractionFormGroupValue): Interaction {
		const interaction: Interaction = {
			_id: formValue._id ?? null,
			type: formValue.type ?? null,
			date: formValue.date ?? null,
			topicsDiscussed: (formValue.topicsDiscussed ?? []).map(topic => ({
				topic: topic.topic ?? '',
				notes: topic.notes ?? '',
			}))
		}
		if (formValue.idOfRelationship) interaction.idOfRelationship = formValue.idOfRelationship
		if (formValue.nameOfPerson) interaction.nameOfPerson = formValue.nameOfPerson
		return interaction
	}

	mapFormToModel(form: InteractionFormGroup, relationshipId?: string, personName?: string): Interaction {
		const interaction: Interaction = {
			_id: form.value._id ?? null,
			type: form.value.type ?? null,
			date: form.value.date ?? null,
			topicsDiscussed: (form.value.topicsDiscussed ?? []).map(topic => ({
				topic: topic.topic ?? '',
				notes: topic.notes ?? '',
			})),
		}
		if (form.value.idOfRelationship) interaction.idOfRelationship = form.value.idOfRelationship
		else if (relationshipId) interaction.idOfRelationship = relationshipId

		if (form.value.nameOfPerson) interaction.nameOfPerson = form.value.nameOfPerson
		else if (personName) interaction.nameOfPerson = personName

		return interaction
	}

	mapFormToPayload(form: InteractionFormGroup): InteractionPayloadWithRelationshipId {
		return {
			payload: {
				_id: form.value._id ?? null,
				type: form.value.type!,
				date: form.value.date!,
				topicsDiscussed: form.value.topicsDiscussed!.map(topic => ({
					topic: topic.topic!,
					notes: topic.notes!,
				}))
			},
			relationshipId: form.value.idOfRelationship ?? null,
		}
	}

}
