/**
 * Runs npm-ecosystem frontend tools under Deno without leaving node_modules in
 * the repository. Vite and Vitest still require Node-style package resolution,
 * so the project is copied to a private, disposable staging directory first.
 */

const separator = Deno.build.os === 'windows' ? '\\' : '/';
const projectRoot = await Deno.realPath(new URL('../', import.meta.url));

const tools = {
  vite: 'npm:vite@8.1.4',
  vitest: 'npm:vitest@4.1.10',
  playwright: 'npm:@playwright/test@1.61.1/cli',
} as const;

type ToolName = keyof typeof tools;

const stagedEntries = [
  'src',
  'public',
  'tests',
  'package.json',
  'deno.json',
  'deno.lock',
  'vite.config.ts',
  'playwright.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'index.html',
];

const ignoredParts = new Set([
  '.deno',
  '.git',
  'build',
  'coverage',
  'node_modules',
  'playwright-report',
  'test-results',
]);

function join(...parts: string[]): string {
  return parts.filter(Boolean).join(separator);
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function removeIfPresent(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

async function copyPath(source: string, destination: string): Promise<void> {
  const info = await Deno.lstat(source);
  if (info.isSymlink) {
    throw new Error(`Refusing to stage symlink outside the project copy: ${source}`);
  }

  if (info.isDirectory) {
    await Deno.mkdir(destination, { recursive: true, mode: 0o700 });
    for await (const entry of Deno.readDir(source)) {
      if (ignoredParts.has(entry.name)) continue;
      await copyPath(join(source, entry.name), join(destination, entry.name));
    }
    return;
  }

  if (info.isFile) {
    const parent = destination.slice(0, destination.lastIndexOf(separator));
    await Deno.mkdir(parent, { recursive: true, mode: 0o700 });
    await Deno.copyFile(source, destination);
    await Deno.chmod(destination, info.mode ?? 0o600);
  }
}

async function stageProject(stageRoot: string): Promise<void> {
  for (const entry of stagedEntries) {
    const source = join(projectRoot, entry);
    if (await exists(source)) await copyPath(source, join(stageRoot, entry));
  }

  for await (const entry of Deno.readDir(projectRoot)) {
    if (entry.isFile && entry.name.startsWith('.env')) {
      await copyPath(join(projectRoot, entry.name), join(stageRoot, entry.name));
    }
  }
}

function shouldMirror(tool: ToolName, args: string[]): boolean {
  if (tool === 'vite') return !args.some((arg) => arg === 'build' || arg === 'preview');
  if (tool === 'vitest') return !args.includes('--run');
  return false;
}

async function mirrorChanges(stageRoot: string, watcher: Deno.FsWatcher): Promise<void> {
  const projectPrefix = `${projectRoot}${separator}`;

  for await (const event of watcher) {
    for (const changedPath of event.paths) {
      if (!changedPath.startsWith(projectPrefix)) continue;
      const relativePath = changedPath.slice(projectPrefix.length);
      if (!relativePath || relativePath.split(separator).some((part) => ignoredParts.has(part))) {
        continue;
      }

      const destination = join(stageRoot, relativePath);
      try {
        if (await exists(changedPath)) {
          await copyPath(changedPath, destination);
        } else {
          await removeIfPresent(destination);
        }
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          console.warn(`Unable to mirror ${relativePath}:`, error);
        }
      }
    }
  }
}

async function copyArtifact(stageRoot: string, name: string): Promise<void> {
  const source = join(stageRoot, name);
  if (!(await exists(source))) return;
  const destination = join(projectRoot, name);
  await removeIfPresent(destination);
  await copyPath(source, destination);
}

const [requestedTool, ...toolArgs] = Deno.args;
if (!requestedTool || !(requestedTool in tools)) {
  console.error(`Usage: deno-tool.ts <${Object.keys(tools).join('|')}> [arguments...]`);
  Deno.exit(2);
}

const tool = requestedTool as ToolName;
const temporaryRoot = await Deno.realPath(
  await Deno.makeTempDir({ prefix: 'dentistdss-pwa-' }),
);
const stageRoot = join(temporaryRoot, 'workspace');
const isViteBuild = tool === 'vite' && toolArgs.includes('build');
const childPermissions = tool === 'playwright' ? ['--allow-all'] : tool === 'vitest'
  ? [
    '--allow-read',
    `--allow-write=${temporaryRoot}`,
    '--allow-env',
    '--allow-sys',
    `--allow-ffi=${temporaryRoot}`,
    `--allow-run=${Deno.execPath()}`,
  ]
  : [
    isViteBuild ? `--allow-read=${temporaryRoot}` : '--allow-read',
    `--allow-write=${temporaryRoot}`,
    '--allow-env',
    '--allow-net',
    '--allow-sys',
    `--allow-ffi=${temporaryRoot}`,
  ];
let watcher: Deno.FsWatcher | undefined;
let mirrorTask: Promise<void> | undefined;
let child: Deno.ChildProcess | undefined;
let shuttingDown = false;

async function shutdown(signal: 'SIGINT' | 'SIGTERM'): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  watcher?.close();

  try {
    child?.kill(signal);
    await child?.status;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) console.warn('Unable to stop child tool:', error);
  }

  await removeIfPresent(temporaryRoot);
  Deno.exit(signal === 'SIGINT' ? 130 : 143);
}

const handleInterrupt = () => void shutdown('SIGINT');
const handleTerminate = () => void shutdown('SIGTERM');
if (Deno.build.os !== 'windows') {
  Deno.addSignalListener('SIGINT', handleInterrupt);
  Deno.addSignalListener('SIGTERM', handleTerminate);
}

try {
  await Deno.chmod(temporaryRoot, 0o700);
  await Deno.mkdir(stageRoot, { mode: 0o700 });
  await Deno.writeTextFile(
    join(temporaryRoot, 'pnpm-workspace.yaml'),
    'packages:\n  - workspace\n',
    { mode: 0o600 },
  );
  await stageProject(stageRoot);

  if (shouldMirror(tool, toolArgs)) {
    const watchTargets = ['src', 'public', 'tests', 'index.html']
      .map((entry) => join(projectRoot, entry));
    watcher = Deno.watchFs(watchTargets, { recursive: true });
    mirrorTask = mirrorChanges(stageRoot, watcher);
  }

  console.log(`Running ${tool} under Deno in an isolated temporary workspace...`);
  child = new Deno.Command(Deno.execPath(), {
    cwd: stageRoot,
    args: [
      '--quiet',
      'run',
      '--frozen',
      '--node-modules-dir=auto',
      ...childPermissions,
      tools[tool],
      ...toolArgs,
    ],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    env: {
      DENO_NO_UPDATE_CHECK: '1',
      TEMP: temporaryRoot,
      TMP: temporaryRoot,
      TMPDIR: temporaryRoot,
    },
  }).spawn();

  const status = await child.status;
  watcher?.close();
  await mirrorTask?.catch((error) => {
    if (!(error instanceof Deno.errors.BadResource)) throw error;
  });

  if (status.success) {
    if (tool === 'vite' && toolArgs.includes('build')) await copyArtifact(stageRoot, 'build');
    if (tool === 'vitest' && toolArgs.includes('--coverage')) {
      await copyArtifact(stageRoot, 'coverage');
    }
    if (tool === 'playwright' && toolArgs.includes('test')) {
      await copyArtifact(stageRoot, 'playwright-report');
      await copyArtifact(stageRoot, 'test-results');
    }
  }

  Deno.exitCode = status.code;
} finally {
  if (Deno.build.os !== 'windows') {
    Deno.removeSignalListener('SIGINT', handleInterrupt);
    Deno.removeSignalListener('SIGTERM', handleTerminate);
  }
  watcher?.close();
  await removeIfPresent(temporaryRoot);
}
