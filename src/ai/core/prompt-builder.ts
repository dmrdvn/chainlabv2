import type { ChatMessage } from './types';
import { baseSystemPrompt, supportModeSystemPrompt } from '../prompts/system-prompts';

interface FileInfo {
  path: string;
  content: string | null;
}

interface CompilationSummaryForPrompt {
  status: string;
  message: string;
  artifacts?: Record<string, any> | null;
}

interface ProjectContextForPrompt {
  projectName?: string;
  projectDescription?: string;
  platform: string;
  fileSystem: {
    allFiles: FileInfo[];
    openFiles: FileInfo[];
    activeFile: FileInfo | null;
  };
  compilationSummary?: CompilationSummaryForPrompt | null;
  isCompiling: boolean;
}

interface BuildPromptOptions {
  mode: 'support' | 'assistant';
  userMessageContent: string;
  history?: ChatMessage[];
  projectContext?: ProjectContextForPrompt;
}

export function buildChatPrompt(options: BuildPromptOptions): ChatMessage[] {
  const { mode, userMessageContent, history = [], projectContext } = options;

  const messages: ChatMessage[] = [];

  let systemContent = baseSystemPrompt;
  if (mode === 'support') {
    systemContent += `\n\n${supportModeSystemPrompt}`;
  } else {
  }
  messages.push({
    id: 'system-prompt',
    role: 'system',
    content: systemContent,
    timestamp: new Date().toISOString(),
  });

  let contextString = '';
  if (projectContext) {
    contextString += '\n\n--- Project Overview ---\n';
    if (projectContext.projectName)
      contextString += `Project Name: ${projectContext.projectName}\n`;
    if (projectContext.projectDescription)
      contextString += `Description: ${projectContext.projectDescription}\n`;
    contextString += `Platform/Blockchain: ${projectContext.platform}\n`;

    contextString += '\n--- File System Context ---\n';

    if (
      projectContext.fileSystem.activeFile &&
      typeof projectContext.fileSystem.activeFile.path === 'string'
    ) {
      const activeFile = projectContext.fileSystem.activeFile;
      const lang = activeFile.path.split('.').pop() || '';
      const contentToDisplay = activeFile.content;
      contextString += `Active File: ${activeFile.path}
\`\`\`${lang}
${contentToDisplay}
\`\`\`

`;
    }

    contextString += `Open File Paths (${projectContext.fileSystem.openFiles.length}): 
`;
    projectContext.fileSystem.openFiles.forEach((file, index) => {
      if (file && typeof file.path === 'string') {
        if (index < 15) {
          contextString += `  - ${file.path}
`;
        } else if (index === 15) {
          contextString += `  ... and ${projectContext.fileSystem.openFiles.length - 15} more open files not listed.
`;
        }
      } else {
        if (index < 15) {
          contextString += `  - [Invalid file entry or missing path]
`;
        }
      }
    });

    contextString += `
All Project File Paths (${projectContext.fileSystem.allFiles.length} total - showing up to 20 paths): 
`;
    projectContext.fileSystem.allFiles.slice(0, 20).forEach((file) => {
      if (file && typeof file.path === 'string') {
        contextString += `  - ${file.path}
`;
      } else {
        contextString += `  - [Invalid file entry or missing path]
`;
      }
    });
    if (projectContext.fileSystem.allFiles.length > 20) {
      contextString += `  ... and ${projectContext.fileSystem.allFiles.length - 20} more files not listed.\n`;
    }
    contextString += '--- End of File System Context ---\n';

    if (projectContext.compilationSummary) {
      contextString += '\n--- Compilation Context ---\n';
      contextString += `Status: ${projectContext.compilationSummary.status}\n`;
      contextString += `Summary: ${projectContext.compilationSummary.message}\n`;
      if (
        projectContext.compilationSummary.status === 'success' &&
        projectContext.compilationSummary.artifacts
      ) {
        const artifactKeys = Object.keys(projectContext.compilationSummary.artifacts);
        if (artifactKeys.length > 0) {
          contextString += `Compiled artifacts: ${artifactKeys.join(', ')}\n`;
        }
      }
      contextString += '--- End of Compilation Context ---\n';
    }

    if (projectContext.isCompiling) {
      contextString += '\nNote: A compilation is currently in progress.\n';
    }
  }

  if (contextString) {
    const systemMessage = messages.find((msg) => msg.role === 'system');
    if (systemMessage && typeof systemMessage.content === 'string') {
      systemMessage.content += `\n${contextString}`;
    } else {
      messages.splice(1, 0, {
        id: 'context-info',
        role: 'system',
        content: contextString,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (history) {
    messages.push(
      ...history.map((h) => ({
        ...h,
        id: h.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: h.timestamp || new Date().toISOString(),
      }))
    );
  }

  messages.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content: userMessageContent,
    timestamp: new Date().toISOString(),
  });

  return messages;
}
