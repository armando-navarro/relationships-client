
export interface InsertedId {
	insertedId: string
}

export type Cancelable<T extends object> =
	| { wasCancelled: true } & { [K in keyof T]?: never }
	| { wasCancelled: false } & T
