const GITHUB_API = 'https://api.github.com';

async function ghFetch(path: string, token: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
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
