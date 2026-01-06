import { MatDialogConfig } from "@angular/material/dialog"
import { MatSnackBarConfig } from "@angular/material/snack-bar"
import { MatTooltipDefaultOptions } from "@angular/material/tooltip"

export const tooltipDefaults: MatTooltipDefaultOptions = {
	showDelay: 1000,
	hideDelay: 100,
	touchendHideDelay: 100,
	position: 'below',
}

export const dialogConfigDefaults: MatDialogConfig = { disableClose: true, maxWidth: 496 }
export const snackbarConfigDefaults: MatSnackBarConfig = { duration: 5000, verticalPosition: 'bottom' }
