export interface PullRequest {
  number: number;
  title: string;
  url: string;
  state: 'open' | 'merged' | 'closed';
  mergedAt?: string;
}

export interface Milestone {
  title: string;
  openIssues: number;
  closedIssues: number;
  totalIssues: number;
  progress: number;
}

export interface Release {
  version: string;
  date: string;
  url: string;
}

export interface App {
  id: string;
  name: string;
  repository: string;
  platform: 'ios' | 'android' | 'both';
  icon: string;
  links: {
    github: string;
    appStore?: string;
    playStore?: string;
  };
  latestRelease?: Release;
  storeVersions?: {
    appStore?: string;
    playStore?: string;
  };
  milestone?: Milestone;
  recentPRs?: PullRequest[];
}

export interface AppsData {
  lastUpdated: string;
  apps: App[];
}
