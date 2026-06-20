import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActivateOrganizationRequest,
  CreateOrganizationRequest,
} from '../../models/api/requests/organization-request.request';
import {
  OrganizationActivatedResponse,
  OrganizationActivationDetails,
  OrganizationRequestSubmittedResponse,
} from '../../models/api/responses/organization-request.response';

@Injectable({
  providedIn: 'root',
})
export class OrganizationRequestsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.domain}/organization-requests`;

  submit(
    request: CreateOrganizationRequest
  ): Observable<OrganizationRequestSubmittedResponse> {
    return this.http.post<OrganizationRequestSubmittedResponse>(
      this.endpoint,
      request
    );
  }

  getActivation(
    requestId: number,
    token: string
  ): Observable<OrganizationActivationDetails> {
    const params = new HttpParams().set('token', token);

    return this.http.get<OrganizationActivationDetails>(
      `${this.endpoint}/${requestId}/activation`,
      { params }
    );
  }

  activate(
    requestId: number,
    request: ActivateOrganizationRequest
  ): Observable<OrganizationActivatedResponse> {
    return this.http.post<OrganizationActivatedResponse>(
      `${this.endpoint}/${requestId}/activate`,
      request
    );
  }
}
