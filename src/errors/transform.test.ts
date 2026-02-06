import { describe, test } from 'node:test';
import assert from 'node:assert';
import { transformHttpError, transformNetworkError } from './transform.ts';

describe('transformHttpError', () => {
  test('401 error produces auth failure message mentioning BUKKU_API_TOKEN', () => {
    const result = transformHttpError(401, { message: 'Unauthorized' }, 'create invoice');

    assert.strictEqual(result.isError, true);
    assert.ok(Array.isArray(result.content));
    assert.strictEqual(result.content.length, 1);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(text.includes('Bukku') || text.includes('token'), 'Should mention Bukku or token');
    assert.ok(text.includes('BUKKU_API_TOKEN'), 'Should mention BUKKU_API_TOKEN');
    assert.ok(text.length > 20, 'Should suggest next step');
  });

  test('403 error produces permission error with suggestion', () => {
    const result = transformHttpError(403, { message: 'Forbidden' }, 'list contacts');

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(
      text.toLowerCase().includes('permission') || text.toLowerCase().includes('access'),
      'Should mention permission or access'
    );
    assert.ok(text.length > 20, 'Should suggest next step');
  });

  test('404 error suggests listing available items', () => {
    const result = transformHttpError(404, { message: 'Not found' }, 'get sales invoice');

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(
      text.toLowerCase().includes("couldn't find") || text.toLowerCase().includes('not found'),
      'Should indicate not found'
    );
    assert.ok(
      text.toLowerCase().includes('list') || text.toLowerCase().includes('available'),
      'Should suggest listing items'
    );
  });

  test('400 error shows all validation errors at once', () => {
    const result = transformHttpError(
      400,
      {
        message: 'Validation failed',
        errors: {
          contact_id: ['required'],
          date: ['invalid format'],
        },
      },
      'create invoice'
    );

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(text.includes('contact_id'), 'Should include contact_id error');
    assert.ok(text.includes('date'), 'Should include date error');
    assert.ok(text.length > 20, 'Should suggest next step');
  });

  test('400 error without errors field shows message', () => {
    const result = transformHttpError(
      400,
      { message: 'Something wrong' },
      'update order'
    );

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(text.includes('Something wrong'), 'Should include error message');
    assert.ok(text.length > 20, 'Should suggest next step');
  });

  test('422 validation error handled like 400', () => {
    const result = transformHttpError(
      422,
      {
        message: 'Unprocessable',
        errors: {
          items: ['at least one item required'],
        },
      },
      'create invoice'
    );

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(text.includes('items'), 'Should include items error');
    assert.ok(text.length > 20, 'Should suggest next step');
  });

  test('500 error produces helpful fallback with retry suggestion', () => {
    const result = transformHttpError(500, { message: 'Internal error' }, 'list invoices');

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(
      text.toLowerCase().includes('unexpected') || text.toLowerCase().includes('error'),
      'Should indicate unexpected error'
    );
    assert.ok(
      text.toLowerCase().includes('try') || text.toLowerCase().includes('again'),
      'Should suggest trying again'
    );
  });

  test('503 error suggests trying later', () => {
    const result = transformHttpError(503, { message: 'Service unavailable' }, 'create payment');

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(
      text.toLowerCase().includes('unavailable') || text.toLowerCase().includes('temporarily'),
      'Should indicate service unavailable'
    );
    assert.ok(
      text.toLowerCase().includes('later') || text.toLowerCase().includes('try'),
      'Should suggest trying later'
    );
  });
});

describe('transformNetworkError', () => {
  test('network error suggests checking connection', () => {
    const networkError = new TypeError('Failed to fetch');
    const result = transformNetworkError(networkError, 'list contacts');

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');

    const text = result.content[0].text;
    assert.ok(
      text.toLowerCase().includes('connect') || text.toLowerCase().includes('network'),
      'Should mention connection or network'
    );
    assert.ok(text.length > 20, 'Should suggest next step');
  });

  test('handles unknown error gracefully', () => {
    const result = transformNetworkError('unknown error', 'create invoice');

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.length > 10, 'Should provide some error message');
  });
});
