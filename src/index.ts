import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Create server instance
const server = new McpServer({
  name: "github-pullrequest-review",
  version: "1.0.0",
});

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN environment variable is not set");
  process.exit(1);
}

// Helper function for making GitHub API requests
async function makeGitHubRequest<T>(url: string): Promise<T | null> {
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-pullrequest-review/1.0.0",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making GitHub request:", error);
    return null;
  }
}

interface PullRequest {
  title: string;
  html_url: string;
  user: {
    login: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
  state: string;
  number: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

interface PullRequestFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
  contents_url: string;
  patch?: string;
}

// Register GitHub PR tools
server.tool(
  "get-pull-request",
  "Get information about a GitHub pull request",
  {
    owner: z.string().describe("Repository owner/organization name"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().positive().describe("Pull request number"),
  },
  async ({ owner, repo, pr_number }) => {
    const prUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pr_number}`;
    const prData = await makeGitHubRequest<PullRequest>(prUrl);

    if (!prData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve pull request data",
          },
        ],
      };
    }

    const prInfo = `
# Pull Request: ${prData.title} (#${prData.number})

**Author:** ${prData.user.login}
**URL:** ${prData.html_url}
**State:** ${prData.state}
**Created:** ${new Date(prData.created_at).toLocaleString()}
**Updated:** ${new Date(prData.updated_at).toLocaleString()}

**Changes:**
- ${prData.changed_files} files changed
- ${prData.additions} additions
- ${prData.deletions} deletions

**Description:**
${prData.body || "No description provided"}
`;

    return {
      content: [
        {
          type: "text",
          text: prInfo,
        },
      ],
    };
  }
);

server.tool(
  "get-pull-request-files",
  "Get files changed in a GitHub pull request",
  {
    owner: z.string().describe("Repository owner/organization name"),
    repo: z.string().describe("Repository name"),
    pr_number: z.number().positive().describe("Pull request number"),
  },
  async ({ owner, repo, pr_number }) => {
    const filesUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pr_number}/files`;
    const filesData = await makeGitHubRequest<PullRequestFile[]>(filesUrl);

    if (!filesData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve pull request files data",
          },
        ],
      };
    }

    if (filesData.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No files changed in this pull request",
          },
        ],
      };
    }

    const filesList = filesData.map((file) => {
      return `
## ${file.filename}
- Status: ${file.status}
- Changes: ${file.changes} (${file.additions} additions, ${
        file.deletions
      } deletions)
${file.patch ? `\n\`\`\`diff\n${file.patch}\n\`\`\`` : ""}
`;
    });

    const filesText = `# Files Changed in Pull Request\n\n${filesList.join(
      "\n"
    )}`;

    return {
      content: [
        {
          type: "text",
          text: filesText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub PR Review MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
