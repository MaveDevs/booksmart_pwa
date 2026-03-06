import { TestBed } from '@angular/core/testing';

import { Establishments } from './establishments';

describe('Establishments', () => {
  let service: Establishments;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Establishments);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
