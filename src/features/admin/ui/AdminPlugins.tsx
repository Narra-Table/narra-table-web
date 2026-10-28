import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/field';
import {
  createAdminPlugin,
  deleteAdminPlugin,
  replaceAdminPlugin,
  updateAdminPlugin,
  validateAdminPlugin,
  type AdminPlugin,
  type AdminPluginPackageInfo,
  type AdminPluginValidation,
} from '../api/adminClient';
import { adminPluginsQuery } from '../api/adminQueries';
import { adminErrorMessage } from '../model/copy';

export function AdminPlugins() {
  const queryClient = useQueryClient();
  const plugins = useQuery(adminPluginsQuery);
  const [creating, setCreating] = useState(false);
  const [createFileName, setCreateFileName] = useState('');
  const [preview, setPreview] = useState<AdminPluginValidation | null>(null);
  const [replaceFileName, setReplaceFileName] = useState('');
  const [replacePreview, setReplacePreview] = useState<AdminPluginValidation | null>(null);
  const [selected, setSelected] = useState<AdminPlugin | null>(null);
  const [error, setError] = useState('');
  const createFile = useRef<File | null>(null);
  const replaceFile = useRef<File | null>(null);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: adminPluginsQuery.queryKey });
  }

  const validate = useMutation({
    mutationFn: (file: File) => validateAdminPlugin(file),
    onSuccess: (result, file) => {
      setError('');
      if (createFile.current === file) setPreview(result);
      if (replaceFile.current === file) setReplacePreview(result);
    },
    onError: (caught, file) => {
      if (createFile.current === file) setPreview(null);
      if (replaceFile.current === file) setReplacePreview(null);
      setError(adminErrorMessage(caught));
    },
  });
  const create = useMutation({
    mutationFn: (file: File) => createAdminPlugin(file, true),
    onSuccess: () => {
      setCreating(false);
      createFile.current = null;
      setCreateFileName('');
      setPreview(null);
      setError('');
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });
  const toggle = useMutation({
    mutationFn: (plugin: AdminPlugin) =>
      updateAdminPlugin(plugin.pluginId, { enabled: !plugin.enabled }),
    onSuccess: () => {
      setError('');
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });
  const replace = useMutation({
    mutationFn: (file: File) => {
      if (!selected) throw new Error('missing plugin');
      return replaceAdminPlugin(selected.pluginId, file);
    },
    onSuccess: (plugin) => {
      setSelected(plugin);
      replaceFile.current = null;
      setReplaceFileName('');
      setReplacePreview(null);
      setError('');
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });
  const remove = useMutation({
    mutationFn: (pluginId: string) => deleteAdminPlugin(pluginId),
    onSuccess: () => {
      setSelected(null);
      setError('');
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });

  function chooseCreateFile(file: File) {
    createFile.current = file;
    setCreateFileName(file.name);
    setPreview(null);
    setError('');
    validate.mutate(file);
  }
  function chooseReplaceFile(file: File) {
    replaceFile.current = file;
    setReplaceFileName(file.name);
    setReplacePreview(null);
    setError('');
    validate.mutate(file);
  }

  const replaceNameMismatch =
    selected && replacePreview ? replacePreview.plugin.name !== selected.name : false;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">插件</h1>
          <p className="mt-2 text-sm text-text-muted">
            选择一个 .ntp 插件包即可试加载。内置插件只读，自定义插件可以替换包、停用和删除。
          </p>
        </div>
        <Button
          onClick={() => {
            createFile.current = null;
            setCreateFileName('');
            setPreview(null);
            setError('');
            setCreating(true);
          }}
        >
          新建插件
        </Button>
      </div>
      {error && !creating && !selected && <FieldError>{error}</FieldError>}
      {plugins.isPending && <p className="text-sm text-text-muted">正在读取插件...</p>}
      {plugins.isError && <FieldError>{adminErrorMessage(plugins.error)}</FieldError>}
      {plugins.data && plugins.data.length === 0 && (
        <p className="rounded-card border border-border-subtle bg-surface p-4 text-sm text-text-muted">
          还没有插件。
        </p>
      )}
      <div className="grid gap-3">
        {plugins.data?.map((plugin) => (
          <article
            key={plugin.pluginId}
            className="flex flex-col gap-3 rounded-card border border-border-subtle bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{plugin.displayName || plugin.name}</h2>
                <span className="text-xs text-text-muted">{plugin.version}</span>
                {plugin.builtIn && (
                  <span className="rounded-sm bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                    内置
                  </span>
                )}
                <span className={plugin.enabled ? 'text-xs text-success' : 'text-xs text-warning'}>
                  {plugin.enabled ? '已启用' : '已停用'}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {plugin.name}
                {plugin.author ? ` · ${plugin.author}` : ''}
              </p>
              {plugin.description && <p className="mt-2 text-sm">{plugin.description}</p>}
              {plugin.depends && plugin.depends.length > 0 && (
                <p className="mt-1 text-sm text-text-muted">依赖：{plugin.depends.join('、')}</p>
              )}
              {plugin.windows && plugin.windows.length > 0 && (
                <p className="mt-1 text-sm text-text-muted">
                  窗口：{plugin.windows.map((window) => window.title).join('、')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  replaceFile.current = null;
                  setReplaceFileName('');
                  setReplacePreview(null);
                  setError('');
                  setSelected(plugin);
                }}
              >
                {plugin.builtIn ? '查看' : '编辑'}
              </Button>
              {!plugin.builtIn && (
                <Button
                  variant="secondary"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate(plugin)}
                >
                  {plugin.enabled ? '停用' : '启用'}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {creating && (
        <Dialog
          title="新建插件"
          onClose={() => {
            setCreating(false);
            setPreview(null);
            setError('');
          }}
        >
          <form
            className="flex max-h-[70vh] flex-col gap-3 overflow-auto"
            onSubmit={(event) => {
              event.preventDefault();
              if (createFile.current) create.mutate(createFile.current);
            }}
          >
            <PluginFileField fileName={createFileName} onFile={chooseCreateFile} />
            {validate.isPending && createFile.current && (
              <p className="text-sm text-text-muted">正在试加载...</p>
            )}
            {error && <FieldError>{error}</FieldError>}
            {preview && (
              <>
                <PackageFacts info={preview.plugin} />
                <p className="text-sm text-success">{commandSummary(preview)}</p>
              </>
            )}
            <Button type="submit" disabled={create.isPending || !preview}>
              创建
            </Button>
          </form>
        </Dialog>
      )}
      {selected && (
        <Dialog
          title={selected.builtIn ? '查看插件' : '编辑插件'}
          onClose={() => {
            setSelected(null);
            setError('');
          }}
        >
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-auto">
            <PackageFacts info={selected} />
            {!selected.builtIn && (
              <PluginFileField
                label="替换插件包"
                fileName={replaceFileName}
                onFile={chooseReplaceFile}
              />
            )}
            {validate.isPending && replaceFile.current && (
              <p className="text-sm text-text-muted">正在试加载...</p>
            )}
            {error && <FieldError>{error}</FieldError>}
            {replacePreview && replaceNameMismatch && (
              <FieldError>
                这个包的名称是 {replacePreview.plugin.name}，不能替换 {selected.name}。
              </FieldError>
            )}
            {replacePreview && !replaceNameMismatch && (
              <>
                <PackageFacts info={replacePreview.plugin} />
                <p className="text-sm text-success">{commandSummary(replacePreview)}</p>
              </>
            )}
            {!selected.builtIn && (
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={
                    replace.isPending ||
                    !replacePreview ||
                    replaceNameMismatch ||
                    !replaceFile.current
                  }
                  onClick={() => {
                    if (replaceFile.current) replace.mutate(replaceFile.current);
                  }}
                >
                  替换
                </Button>
                <Button
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `删除自定义插件 ${selected.displayName || selected.name}？此操作不能撤销。`,
                      )
                    ) {
                      remove.mutate(selected.pluginId);
                    }
                  }}
                >
                  删除
                </Button>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
}

function commandSummary(result: AdminPluginValidation) {
  const names = result.commands.map((command) => command.name).filter(Boolean);
  return names.length > 0
    ? `试加载通过，识别到指令：${names.join('、')}`
    : '试加载通过，没有识别到指令。';
}

function PackageFacts({ info }: { info: AdminPluginPackageInfo }) {
  return (
    <dl className="grid gap-2 rounded-control border border-border-subtle bg-app-bg px-4 py-3 text-sm">
      <Fact label="名称" value={info.name} />
      <Fact label="显示名" value={info.displayName} />
      <Fact label="版本" value={info.version} />
      <Fact label="作者" value={info.author} />
      <Fact label="说明" value={info.description} />
      <Fact label="角色卡" value={info.characterDataType} />
      <Fact label="依赖" value={info.depends?.join('、')} />
      <Fact label="窗口" value={info.windows?.map((window) => window.title).join('、')} />
    </dl>
  );
}

function Fact({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-14 shrink-0 text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{value?.trim() ? value : '无'}</dd>
    </div>
  );
}

function PluginFileField({
  fileName,
  label = '插件包',
  onFile,
}: {
  fileName: string;
  label?: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
      {label}
      <span className="relative flex cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-app-bg px-4 py-2 font-normal">
        <span className={fileName ? 'truncate text-text' : 'text-text-muted'}>
          {fileName || '选择 .ntp 文件'}
        </span>
        <span className="shrink-0 font-medium text-accent">浏览</span>
        <input
          type="file"
          accept=".ntp,application/zip"
          className="absolute size-0 opacity-0"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = '';
          }}
        />
      </span>
    </label>
  );
}
