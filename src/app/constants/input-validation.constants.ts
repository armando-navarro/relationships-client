import { Validators } from '@angular/forms'

const AppValidators = {
	notes: Validators.maxLength(1000),
	relationshipNamePart: Validators.maxLength(50),
	topicName: [Validators.required, Validators.maxLength(25)],
}

export default AppValidators
