import {
    Component,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { QueryResult, QueryResultsDisplayComponent } from '../report-table/report-table.component';
import { QueryResultService } from '../../core/services/utility/query-result.service';

@Component({
    selector: 'report-view',
    templateUrl: './report-view.component.html',
    styleUrls: ['./report-view.component.scss'],
    standalone: true,
    imports: [QueryResultsDisplayComponent],
})
export class ReportViewComponent implements OnInit {
    private readonly queryResultService = inject(QueryResultService);

    queryResult = signal<QueryResult | null>(null);

    ngOnInit(): void {
        this.queryResultService.queryResult$.subscribe((result) => {
            this.queryResult.set(result);

            if (!result) {
                console.warn('No query result passed.');
            }
        });
    }
}
