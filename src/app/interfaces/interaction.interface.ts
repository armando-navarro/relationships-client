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
export type TimeUnit = 'day'|'week'|'month'
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
	OnlineGaming = 'Online gaming',
	PhoneCall = 'Phone call',
	SocialMedia = 'Social media',
	SnailMail = 'Snail mail',
	Texting = 'Text messaging',
	VideoCall = 'Video call',
	VoiceMail = 'Voice mail',
	Other = 'Other'
}
export const interactionTypeToIcon = new Map<InteractionType, string>([
	[InteractionType.Email, 'mail'],
	[InteractionType.InPerson, 'emoji_people'],
	[InteractionType.OnlineGaming, 'sports_esports'],
	[InteractionType.PhoneCall, 'call'],
	[InteractionType.SocialMedia, 'share'],
	[InteractionType.SnailMail, 'local_post_office'],
	[InteractionType.Texting, 'chat_bubble'],
	[InteractionType.VideoCall, 'videocam'],
	[InteractionType.VoiceMail, 'voicemail'],
	[InteractionType.Other, 'help']
])
//#endregion
