import { Interaction, InteractionResponse, InteractionWriteResponse } from "./interaction.interface"
import { RelationshipMapperService } from "../services/mappers/relationship.mapper.service"

//#region models for INTERNAL use
export interface Relationship {
	_id: string|null
	firstName: string
	lastName: string|null
	fullName: string
	interactions: Interaction[]
	interactionRateGoal: InteractionRate|null
	notes: string

	lastInteractionDate?: Date|null
	lastInteractionRelativeTime?: string|null
	daysUntilAttentionNeeded?: number|null
	attentionNeededText?: string
	attentionNeededStatus?: AttentionNeededStatus
	attentionStatusColor?: string
}
export interface RelationshipGroup {
	status: AttentionNeededStatus,
	statusColor: string,
	relationships: Relationship[],
}
export type RelationshipsGroupedByStatus = Record<AttentionNeededStatus, RelationshipGroup>
export type RelationshipFormGroup = ReturnType<typeof RelationshipMapperService.prototype.mapModelToForm>
export type RelationshipFormGroupValue = RelationshipFormGroup['value']
export interface UpdatedRelationshipProperties {
	updatedRelationshipProperties: RelationshipDerivedProperties
}
export interface RelationshipDerivedProperties {
	lastInteractionDate: Date|null
	lastInteractionRelativeTime?: string|null
	daysUntilAttentionNeeded?: number|null
	attentionNeededText?: string
	attentionNeededStatus?: AttentionNeededStatus
	attentionStatusColor?: string
	fullName?: string
}
//#endregion models for INTERNAL use

//#region API PAYLOAD interfaces
export interface RelationshipPayload {
	_id: string|null
	firstName: string
	lastName: string|null
	interactions: Interaction[]
	interactionRateGoal: InteractionRate|null
	notes: string
}
//#endregion API PAYLOAD interfaces

//#region API RESPONSE interfaces
export interface RelationshipResponse {
	_id: string|null
	firstName: string
	lastName: string|null
	fullName: string
	interactions: InteractionResponse[]
	interactionRateGoal: InteractionRate|null
	notes: string

	lastInteractionDate: string|null
	daysUntilAttentionNeeded: number|null
	attentionNeededText: string
	attentionNeededStatus: AttentionNeededStatus
	attentionStatusColor: string
}
export interface RelationshipGroupResponse {
	status: AttentionNeededStatus,
	statusColor: string,
	relationships: RelationshipResponse[],
}
export type RelationshipsGroupedByStatusResponse = Record<AttentionNeededStatus, RelationshipGroupResponse>
export interface RelationshipDerivedPropertiesResponse {
	lastInteractionDate: string|null
	lastInteractionRelativeTime?: string|null
	daysUntilAttentionNeeded?: number|null
	attentionNeededText?: string
	attentionNeededStatus?: AttentionNeededStatus
	attentionStatusColor?: string
	fullName?: string
}
export type RelationshipUpdateResponse = InteractionWriteResponse
//#endregion API RESPONSE interfaces

//#region enums
export enum AttentionNeededStatus {
	Today = 'Due Today',
	Overdue = 'Overdue',
	Soon = 'Due Soon',
	Good = 'No Attention Needed',
	NotAvailable = 'Due Date N/A',
}

export enum InteractionRate {
	EveryDay = 'every day',
	EveryWeek = 'every week',
	EveryTwoWeeks = 'every 2 weeks',
	EveryMonth = 'every month',
	EveryTwoMonths = 'every 2 months',
	EverySixMonths = 'every 6 months',
	EveryYear = 'every year'
}
//#endregion enums
