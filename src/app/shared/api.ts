import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'

import { environment } from '../../environments/environment'
import { InsertedId } from './misc-interface'
import { AddInteractionResponse, Interaction, InteractionPayload, InteractionResponse, InteractionWriteResponse } from '../interactions/interaction-interface'
import { InteractionMapper } from '../interactions/interaction-mapper'
import {
	Relationship,
	RelationshipAddResponse,
	RelationshipDerivedProperties,
	RelationshipGroup,
	RelationshipPayload,
	RelationshipResponse,
	RelationshipsGroupedByStatusResponse,
	RelationshipUpdateResponse,
	UpdatedRelationshipProperties,
} from '../relationships/relationship-interface'
import { RelationshipMapper } from '../relationships/relationship-mapper'

@Injectable({ providedIn: 'root' })
export class Api {
	private baseUrl = environment.apiUrl
	private readonly http = inject(HttpClient)
	private readonly interactionMapper = inject(InteractionMapper)
	private readonly relationshipMapper = inject(RelationshipMapper)

	//#region Relationship endpoints

	/** Fetch relationships grouped by attention-needed status. */
	getRelationshipsGroupedByStatus(): Observable<RelationshipGroup[]> {
		return this.http.get<RelationshipsGroupedByStatusResponse>(`${this.baseUrl}/relationships`).pipe(
			map(groupedRelationships => this.relationshipMapper.mapGroupedByStatusResponseToModel(groupedRelationships))
		)
	}

	/** Fetch a single relationship by id and map it into the a `Relationship` model. */
	getRelationship(id: string): Observable<Relationship> {
		return this.http.get<RelationshipResponse>(`${this.baseUrl}/relationships/${id}`).pipe(
			map(relationship => this.relationshipMapper.mapResponseToModel(relationship))
		)
	}

	/** Create a new relationship. */
	addRelationship(relationship: RelationshipPayload): Observable<RelationshipAddResponse> {
		return this.http.post<RelationshipAddResponse>(`${this.baseUrl}/relationships`, relationship)
	}


	/** Update an existing relationship. */
	updateRelationship(relationship: RelationshipPayload): Observable<RelationshipUpdateResponse> {
		relationship.interactions?.forEach(interaction => delete interaction.idOfRelationship)
		return this.http.put<RelationshipUpdateResponse>(`${this.baseUrl}/relationships/${relationship._id}`, relationship)
	}

	/** Delete a relationship and normalize the empty derived-properties response shape. */
	deleteRelationship(relationshipId: string): Observable<RelationshipDerivedProperties> {
		return this.http.delete<true>(`${this.baseUrl}/relationships/${relationshipId}`).pipe(
			map(() => ({ lastInteractionDate: null }))
		)
	}
	//#endregion

	//#region Interaction endpoints

	/** Fetch all interactions and map them into an `Interaction` model. */
	getInteractions(): Observable<Interaction[]> {
		return this.http.get<InteractionResponse[]>(`${this.baseUrl}/interactions`).pipe(
			map(interactions => this.interactionMapper.mapResponseToModel(interactions))
		)
	}

	/** Fetch a single interaction for a relationship and map it into an `Interaction` model. */
	getInteraction(relationshipId: string, interactionId: string): Observable<Interaction> {
		return this.http.get<InteractionResponse>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interactionId}`).pipe(
			map(interaction => this.interactionMapper.mapResponseToModel(interaction))
		)
	}

	/** Create an interaction and map the derived relationship properties in the response. */
	addInteraction(interaction: InteractionPayload, relationshipId: string): Observable<InsertedId&UpdatedRelationshipProperties> {
		return this.http.post<AddInteractionResponse>(`${this.baseUrl}/relationships/${relationshipId}/interactions`, interaction).pipe(
			map(({ insertedId, updatedRelationshipProperties }) => ({
				insertedId,
				updatedRelationshipProperties: this.relationshipMapper.mapPartialResponseToModel(updatedRelationshipProperties)
			})),
		)
	}

	/** Update an interaction and map the derived relationship properties in the response. */
	updateInteraction(interaction: InteractionPayload, relationshipId: string): Observable<RelationshipDerivedProperties> {
		return this.http.put<InteractionWriteResponse>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interaction._id}`, interaction).pipe(
			map(({ updatedRelationshipProperties }) => this.relationshipMapper.mapPartialResponseToModel(updatedRelationshipProperties)),
		)
	}

	/** Delete an interaction and map the derived relationship properties in the response. */
	deleteInteraction(interaction: Interaction): Observable<RelationshipDerivedProperties> {
		return this.http.delete<InteractionWriteResponse>(`${this.baseUrl}/relationships/${interaction.idOfRelationship}/interactions/${interaction._id}`).pipe(
			map(response => this.relationshipMapper.mapPartialResponseToModel(response.updatedRelationshipProperties))
		)
	}

}
