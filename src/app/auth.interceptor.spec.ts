import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('sends API requests with cookies and no bearer token', () => {
    client.get('http://localhost:5000/api/users/me').subscribe();

    const request = http.expectOne('http://localhost:5000/api/users/me');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('does not send credentials to non-API origins', () => {
    client.get('https://other.example.com/data').subscribe();

    const request = http.expectOne('https://other.example.com/data');
    expect(request.request.withCredentials).toBe(false);
    request.flush({});
  });
});
