const EAS_API = 'https://api.expo.dev/graphql';

async function easQuery(query: string, variables: Record<string, any>, token: string) {
  const res = await fetch(EAS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export async function getExpoApps(token: string, accountNames: string[]) {
  const query = `
    query GetApps($accountName: String!) {
      account {
        byName(accountName: $accountName) {
          apps(limit: 20, offset: 0) {
            id
            name
            slug
            fullName
          }
        }
      }
    }
  `;
  const results = await Promise.all(
    accountNames.map(accountName =>
      easQuery(query, { accountName }, token)
        .then(data => data.account.byName.apps as ExpoApp[])
        .catch(() => [] as ExpoApp[])
    )
  );
  return results.flat();
}

export async function getCurrentUser(token: string) {
  const query = `
    query Me {
      meUserActor {
        username
        profilePhoto
        accounts {
          id
          name
        }
      }
    }
  `;
  const data = await easQuery(query, {}, token);
  return data.meUserActor;
}


export async function getBuildStatus(token: string, buildId: string) {
  const query = `
    query BuildStatus($buildId: ID!) {
      builds {
        byId(buildId: $buildId) {
          id
          status
          platform
          createdAt
          updatedAt
          buildProfile
          expirationDate
          artifacts {
            buildUrl
            xcodeBuildSummaryUrl
          }
          metrics {
            buildDuration
            buildWaitTime
          }
          error {
            errorCode
            message
          }
          logs {
            url
          }
        }
      }
    }
  `;
  const data = await easQuery(query, { buildId }, token);
  return data.builds.byId as Build;
}

export async function getRecentBuilds(token: string, appId: string, limit = 10) {
  const query = `
    query RecentBuilds($appId: ID!, $limit: Int!) {
      app {
        byId(appId: $appId) {
          builds(limit: $limit, offset: 0) {
            id
            status
            platform
            buildProfile
            createdAt
            error {
              message
            }
          }
        }
      }
    }
  `;
  const data = await easQuery(query, { appId, limit }, token);
  return data.app.byId.builds as Build[];
}

export type ExpoApp = {
  id: string;
  name: string;
  slug: string;
  fullName: string;
};

export type Build = {
  id: string;
  status: 'NEW' | 'IN_QUEUE' | 'IN_PROGRESS' | 'FINISHED' | 'ERRORED' | 'CANCELED';
  platform: 'IOS' | 'ANDROID';
  buildProfile: string;
  createdAt: string;
  updatedAt?: string;
  artifacts?: { buildUrl?: string };
  error?: { errorCode?: string; message: string };
  logs?: { url: string };
  metrics?: { buildDuration?: number; buildWaitTime?: number };
};
