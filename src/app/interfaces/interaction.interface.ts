import { RelationshipDerivedPropertiesResponse } from "./relationship.interface"
import { InsertedId } from "./misc.interface"
import { InteractionMapperService } from "../services/mappers/interaction.mapper.service"

//#region models for INTERNAL use
export interface Interaction {
	_id: string|null
	type: InteractionType|null
	idOfRelationship?: string
	nameOfPerson?: string
	date: Date|null
	topicsDiscussed: Topic[]
}
export interface Topic {
	topic: string
	notes: string
}
export interface InteractionGroup {
	groupedBy: TimeUnit,
	timeUnitsAgo: number,
	timeAgoText: string,
	interactions: Interaction[],
}
export type TimeUnit = 'day'|'week'|'month'
export type InteractionFormGroup = ReturnType<typeof InteractionMapperService.prototype.mapModelToForm>
export type InteractionFormGroupValue = InteractionFormGroup['value']
//#endregion

//#region API PAYLOAD interfaces
export interface InteractionPayload {
	_id: string|null
	type: InteractionType
	date: Date
	topicsDiscussed: Topic[]
}
//#endregion

//#region API RESPONSE interfaces
export interface InteractionResponse {
	_id: string
	type: InteractionType
	idOfRelationship: string
	nameOfPerson: string
	date: string
	topicsDiscussed: Topic[]
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
	OnlineGaming = 'OnlineGaming',
	PhoneCall = 'Phone call',
	SocialMedia = 'Social media',
	SnailMail = 'Snail mail',
	Texting = 'Text messaging',
	VideoCall = 'Video call',
	VoiceMail = 'Voice mail',
	Other = 'Other'
}
//#endregion
