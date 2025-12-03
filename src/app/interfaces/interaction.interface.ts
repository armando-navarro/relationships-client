import { RelationshipId } from "./relationship.interface"

export interface InteractionId extends RelationshipId {
	interactionId: string
}

export interface Interaction {
	_id?: string
	type?: InteractionType
	idOfRelationship?: string
	nameOfPerson?: string
	dateString?: string
	date?: Date
	firstInteraction?: boolean
	occasion?: string
	eventAttended?: string
	topicsDiscussed?: Topic[]
	memorableEvents?: {
		event: string
		notes?: string[]
	}
}

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

export enum InteractionRate {
	EveryDay = 'every day',
	TwiceAWeek = 'twice a week',
	EveryWeek = 'every week',
	EveryTwoWeeks = 'every 2 weeks',
	EveryMonth = 'every month',
	EveryTwoMonths = 'every 2 months',
	EverySixMonths = 'every 6 months',
	EveryYear = 'every year',
}

export interface Topic {
	topic: string
	notes?: string
}

export type TimeUnit = 'day'|'week'|'month'

export interface InteractionGroup {
	groupedBy: TimeUnit,
	timeUnitsAgo: number,
	timeAgoText: string,
	interactions: Interaction[],
}
