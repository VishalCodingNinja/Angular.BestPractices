import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, mapTo, tap} from 'rxjs/operators';
import {ApiService} from 'src/app/core/services/http/api.service';
import {IUser} from 'src/app/shared/models/user.model';
import {endpoint} from 'src/environments/endpoint';
import {environment} from 'src/environments/environment';
import {StorageService} from './storage.service';
import {ToastService} from './toast.service';
@Injectable()
export class AuthService {
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly REFRESH_TOKEN = 'REFRESH_TOKEN';
  private readonly ACCESS_TOKEN = `ACCESS_TOKEN`;
 

  constructor(
    private readonly apiService: ApiService,
    private readonly storageService: StorageService,
    private readonly toastService: ToastService
  ) {}

  public isLoggedIn() {
    return !!this.getJwtToken();
  }

  public login(username: string, password: string): Observable<boolean> {
    this.loggedUser = {userName: username, password: password};
    return this.apiService
      .sendRequest({
        apiBase: `${environment.apiBase}`,
        endpoint: endpoint.loginUrl,
        method: 'post',
        headers: {'x-key': x-key},
        body: {
          username: username,
          password: password,
        },
      })
      .pipe(
        tap((res) => this.doLoginUser(username, res)),
        mapTo(true),
        catchError((error) => {
          this.toastService.errorToast(
            'Login Failed! You have entered wrong password/username.',
            'Error!'
          );
          return of(false);
        })
      );
  }

  public doLoginUser(user: string, res: any) {
    this.storeTokens(res.tokenInformation);
  }

  public storeTokens(tokens: any) {
    this.storageService.set(this.JWT_TOKEN, tokens.idToken);
    this.storageService.set(this.REFRESH_TOKEN, tokens.refreshToken);
    this.storageService.set(this.ACCESS_TOKEN, tokens.accessToken);
  }

  public logout() {
    this.loggedUser = null;
    return this.apiService
      .sendRequest({
        apiBase: `${environment.apiBase}`,
        endpoint: endpoint.logoutUrl,
        method: 'post',
        headers: {
          'x-key': x-key,
        },
        body: {accessToken: this.getAccessToken()},
      })
      .pipe(
        tap(() => this.doLogoutUser()),
        mapTo(true),
        catchError(() => {
          this.toastService.errorToast(
            'Logout Failed due to some issue! Please try again.',
            'Error!'
          );
          return of(false);
        })
      );
  }

  getAccessToken() {
    return this.storageService.get(this.ACCESS_TOKEN);
  }

  public refreshToken() {
    return this.apiService
      .sendRequest({
        apiBase: `${environment.apiBase}`,
        endpoint: endpoint.logoutUrl,
        method: 'post',
        body: {refreshToken: this.getRefreshToken()},
      })
      .pipe(
        tap((tokens) => this.storeJwtToken(tokens.jwt)),
        mapTo(true),
        catchError((error) => {
          return of(false);
        })
      );
  }

  public storeJwtToken(jwtToken: any) {
    this.storageService.set(this.JWT_TOKEN, jwtToken);
  }

  public getRefreshToken() {
    return this.storageService.get(this.REFRESH_TOKEN);
  }

  public doLogoutUser() {
    this.loggedUser = null;
    this.removeTokens();
  }

  public removeTokens() {
    this.storageService.clearAll();
  }

  public getJwtToken() {
    if (this.storageService.get(this.JWT_TOKEN)) {
      return this.storageService.get(this.JWT_TOKEN);
    }
  }
}
