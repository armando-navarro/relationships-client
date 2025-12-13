import { HttpClient } from '@angular/common/http'
import { inject, Injectable, SecurityContext } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { map, Observable, tap } from 'rxjs'
import { DateTime } from 'luxon'

import { environment } from '../../environments/environment'
import { InsertedId, Relationship, RelationshipGroup, RelationshipsGroupedByStatus } from '../interfaces/relationship.interface'
import { Interaction } from "../interfaces/interaction.interface"

@Injectable({ providedIn: 'root' })
export class ApiService {
	private baseUrl = environment.apiUrl
	private readonly http = inject(HttpClient)
	private readonly sanitizer = inject(DomSanitizer)

	//#region Relationship endpoints

	getRelationshipsGroupedByStatus(): Observable<RelationshipsGroupedByStatus> {
		return this.http.get<RelationshipsGroupedByStatus>(`${this.baseUrl}/relationships`).pipe(
			tap(groupedRelationships => {
				Object.values(groupedRelationships).forEach((group: RelationshipGroup) => {
					this.processRelationships(group.relationships)
				})
			})
		)
	}

	getRelationship(id: string): Observable<Relationship> {
		return this.http.get<Relationship>(`${this.baseUrl}/relationships/${id}`).pipe(
			tap(relationship => this.processRelationships([relationship]))
		)
	}

	addRelationship(relationship: Relationship): Observable<InsertedId> {
		return this.http.post<InsertedId>(`${this.baseUrl}/relationships`, relationship)
	}

	updateRelationship(relationship: Relationship): Observable<void> {
		relationship.interactions?.forEach(interaction => delete interaction.idOfRelationship)
		return this.http.put<void>(`${this.baseUrl}/relationships/${relationship._id}`, relationship)
	}

	deleteRelationship(relationshipId: string): Observable<true> {
		return this.http.delete<true>(`${this.baseUrl}/relationships/${relationshipId}`).pipe(
			map(() => true)
		)
	}
	//#endregion

	//#region Interaction endpoints

	getInteractions(): Observable<Interaction[]> {
		return this.http.get<Interaction[]>(`${this.baseUrl}/interactions`).pipe(
			tap(interactions => this.processInteractions(interactions))
		)
	}

	getInteraction(relationshipId: string, interactionId: string): Observable<Interaction> {
		return this.http.get<Interaction>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interactionId}`).pipe(
			tap(interaction => this.processInteractions([interaction]))
		)
	}

	addInteraction(interaction: Interaction): Observable<InsertedId> {
		const relationshipId = interaction.idOfRelationship
		delete interaction.idOfRelationship
		return this.http.post<InsertedId>(`${this.baseUrl}/relationships/${relationshipId}/interactions`, interaction)
	}

	updateInteraction(interaction: Interaction): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/relationships/${interaction.idOfRelationship}/interactions/${interaction._id}`, interaction)
	}

	deleteInteraction(interactionId: string, relationshipId: string): Observable<true> {
		return this.http.delete<null>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interactionId}`).pipe(
			map(() => true)
		)
	}
	//#endregion

	//#region helper functions

	private processRelationships(relationships: Relationship[]): void {
		relationships.forEach(relationship => {
			if (relationship.lastInteractionDate) {
				const lastInteractionRelativeTime = DateTime.fromISO(relationship.lastInteractionDate).toRelativeCalendar()
				if (lastInteractionRelativeTime) relationship.lastInteractionRelativeTime = lastInteractionRelativeTime
			}
			relationship.notes = this.convertNewlinesToLineBreaks(relationship.notes)
			this.processInteractions(relationship.interactions)
		})
	}

	private processInteractions(interactions: Interaction[]|undefined): void {
		interactions?.forEach(interaction => {
			interaction.date = new Date(interaction.dateString || interaction.date!)
			delete interaction.dateString
			interaction.topicsDiscussed?.forEach(topic => {
				topic.notes = this.convertNewlinesToLineBreaks(topic.notes)
			})
		})
	}

	private convertNewlinesToLineBreaks(notes: string): string {
		const sanitzedNotes = this.sanitizer.sanitize(SecurityContext.HTML, notes) ?? ''
		return sanitzedNotes.replaceAll('&#10;', '<br />').replaceAll('\n', '<br />')
	}
	//#endregion

}
