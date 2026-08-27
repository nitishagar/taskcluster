import { strict as assert } from 'node:assert';
import testing from '@taskcluster/lib-testing';
import tc from '@taskcluster/client';
import helper from '../helper.js';

const THIS_VERSION = parseInt(/.*\/0*(\d+)_test\.js/.exec(import.meta.url)[1], 10);
const PREV_VERSION = THIS_VERSION - 1;

suite(testing.suiteName(), () => {
  helper.withDbForVersion();

  test('github builds are returned newest first', async () => {
    await testing.resetDb({ testDbUrl: helper.dbUrl });
    const db = await helper.setupDb('github');

    await helper.upgradeTo(PREV_VERSION);

    // builds[0] is the newest (updated one day ago), builds[2] the oldest
    const builds = [1, 2, 3].map(i => ({
      organization: 'org',
      repository: 'repo',
      sha: `sha-${i}`,
      task_group_id: `task-group-${i}`,
      state: 'success',
      created: tc.fromNow(`-${i} days`),
      updated: tc.fromNow(`-${i} days`),
      installation_id: 1234,
      event_type: 'something',
      event_id: 'whatever',
      pull_request_number: 1000 + i,
    }));
    for (const build of builds) {
      await db.fns.create_github_build_pr(
        build.organization,
        build.repository,
        build.sha,
        build.task_group_id,
        build.state,
        build.created,
        build.updated,
        build.installation_id,
        build.event_type,
        build.event_id,
        build.pull_request_number
      );
    }

    const before = await db.fns.get_github_builds_pr(null, null, null, null, null, null);
    assert.equal(before.length, 3);
    before.forEach((build, i) => {
      assert.equal(build.task_group_id, builds[builds.length - i - 1].task_group_id);
    });

    await helper.upgradeTo(THIS_VERSION);

    const after = await db.fns.get_github_builds_pr(null, null, null, null, null, null);
    assert.equal(after.length, 3);
    after.forEach((build, i) => {
      assert.equal(build.task_group_id, builds[i].task_group_id);
    });
  });
});
