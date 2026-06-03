const GITHUB_API = 'https://api.github.com';

async function ghFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function getGitHubUser(token: string) {
  return ghFetch('/user', token) as Promise<GitHubUser>;
}

export async function getRepos(token: string): Promise<GitHubRepo[]> {
  return ghFetch('/user/repos?sort=pushed&per_page=30&affiliation=owner', token);
}

export async function getBranches(token: string, owner: string, repo: string): Promise<GitHubBranch[]> {
  return ghFetch(`/repos/${owner}/${repo}/branches`, token);
}

export async function triggerWorkflow(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  platform: string,
  profile: string
): Promise<void> {
  await ghFetch(
    `/repos/${owner}/${repo}/actions/workflows/eas-build-tpi.yml/dispatches`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ ref: branch, inputs: { platform, profile } }),
    }
  );
}

export async function getLatestWorkflowRun(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<WorkflowRun | null> {
  const data = await ghFetch(
    `/repos/${owner}/${repo}/actions/workflows/eas-build-tpi.yml/runs?branch=${encodeURIComponent(branch)}&per_page=1&event=workflow_dispatch`,
    token
  );
  return data?.workflow_runs?.[0] ?? null;
}

export type GitHubUser = {
  login: string;
  name: string;
  avatar_url: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  pushed_at: string;
  private: boolean;
  language: string | null;
};

export type GitHubBranch = {
  name: string;
  commit: { sha: string };
};

export type WorkflowRun = {
  id: number;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  html_url: string;
  created_at: string;
  name: string;
};
