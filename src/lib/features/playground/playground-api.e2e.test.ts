import dbInit, { type ITestDb } from '../../../test/e2e/helpers/database-init';
import {
    type IUnleashTest,
    setupApp,
} from '../../../test/e2e/helpers/test-helper';
import type { IUnleashStores } from '../../types';
import getLogger from '../../../test/fixtures/no-logger';

let stores: IUnleashStores;
let db: ITestDb;
let app: IUnleashTest;

const flag = {
    name: 'test-flag',
    enabled: true,
    strategies: [{ name: 'default' }],
    createdByUserId: 9999,
};

beforeAll(async () => {
    db = await dbInit('playground_api', getLogger);
    stores = db.stores;

    await stores.featureToggleStore.create('default', flag);

    app = await setupApp(stores);
});

afterAll(async () => {
    await db.destroy();
});

test('strips invalid context properties from input before using it', async () => {
    const validData = {
        appName: 'test',
    };

    const inputContext = {
        invalid: {},
        ...validData,
    };

    const { body } = await app.request
        .post('/api/admin/playground/advanced')
        .send({
            context: inputContext,
            environments: ['production'],
            projects: '*',
        })
        .expect(200);

    const evaluatedContext =
        body.features[0].environments.production[0].context;

    expect(evaluatedContext).toStrictEqual(validData);
});

test('returns the input context exactly as it came in, even if invalid values have been removed for the evaluation', async () => {
    const invalidData = {
        invalid: {},
    };

    const inputContext = {
        ...invalidData,
        appName: 'test',
    };

    const { body } = await app.request
        .post('/api/admin/playground/advanced')
        .send({
            context: inputContext,
            environments: ['production'],
            projects: '*',
        })
        .expect(200);

    expect(body.input.context).toMatchObject(inputContext);
});
