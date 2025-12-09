import { Interaction, InteractionRate } from "./interaction.interface"

export interface RelationshipId {
	relationshipId: string
}

export interface Relationship {
	_id?: string
	firstName?: string
	lastName?: string
	fullName?: string // derived

	interactions?: Interaction[]
	interactionRateGoal?: InteractionRate
	daysUntilGoal?: string // derived
	lastInteractionDate?: string // derived
	lastInteractionRelativeTime?: string // derived
	daysUntilAttentionNeeded?: number
	attentionNeededText?: string
	attentionNeededStatus?: AttentionNeededStatus
	attentionStatusColor?: string

	notes?: string
}

export interface RelationshipsGroupedByStatus {
	[AttentionNeededStatus.Overdue]: RelationshipGroup,
	[AttentionNeededStatus.Today]: RelationshipGroup,
	[AttentionNeededStatus.Soon]: RelationshipGroup,
	[AttentionNeededStatus.Good]: RelationshipGroup,
	[AttentionNeededStatus.NotAvailable]: RelationshipGroup,
}

export interface RelationshipGroup {
	status: AttentionNeededStatus,
	statusColor: string,
	relationships: Relationship[],
}

export enum AttentionNeededStatus {
	Today = 'Due Today',
	Overdue = 'Overdue',
	Soon = 'Due Soon',
	Good = 'No Attention Needed',
	NotAvailable = 'Due Date N/A',
}

export interface InsertedId {
	insertedId: string
}
