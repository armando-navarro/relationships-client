import { RelationshipDerivedPropertiesResponse } from "./relationship.interface"
import { InsertedId } from "./misc.interface"
import { InteractionMapperService } from "../services/mappers/interaction.mapper.service"

//#region models for INTERNAL use
export interface Interaction {
	_id: string|null
	type: InteractionType|null
	typeIcon: string
	idOfRelationship?: string
	nameOfPerson?: string
	date: Date|null
	topics: Topic[]
}
export interface Topic {
	name: string
	notes: string
}
export interface InteractionGroup {
	groupedBy: TimeUnit,
	timeUnitsAgo: number,
	timeAgoText: string,
	interactions: Interaction[],
}
export type TimeUnit = 'day'|'week'|'month'|'year'
export type InteractionTopicFormGroup = ReturnType<typeof InteractionMapperService.prototype.mapTopicModelToForm>
export type InteractionFormGroup = ReturnType<typeof InteractionMapperService.prototype.mapModelToForm>
export type InteractionFormGroupValue = InteractionFormGroup['value']
//#endregion

//#region API PAYLOAD interfaces
export interface InteractionPayload {
	_id: string|null
	type: InteractionType
	date: Date
	topics: Topic[]
}
//#endregion

//#region API RESPONSE interfaces
export interface InteractionResponse {
	_id: string
	type: InteractionType
	idOfRelationship: string
	nameOfPerson: string
	date: string
	topics: Topic[]
}
export interface InteractionWriteResponse {
	updatedRelationshipProperties: RelationshipDerivedPropertiesResponse
}
export type AddInteractionResponse = InsertedId&InteractionWriteResponse

//#endregion

//#region enums
export enum InteractionType {
	Email = 'E-mail',
	InPerson = 'In person',
	GameChat = 'Game chat',
	PhoneCall = 'Phone call',
	SocialMedia = 'Social media',
	PostalMail = 'Postal mail',
	Text = 'Text',
	VideoCall = 'Video call',
	VoiceMail = 'Voice mail',
	Other = 'Other'
}
//#endregion
