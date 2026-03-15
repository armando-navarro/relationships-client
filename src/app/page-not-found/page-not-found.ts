import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'

@Component({
	selector: 'app-page-not-found',
	imports: [MatButtonModule, RouterLink],
	templateUrl: './page-not-found.html',
	styleUrl: './page-not-found.scss'
})
export class PageNotFound {

}
