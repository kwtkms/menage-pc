'use strict';
// Tout ce qui passe par Windows : corbeille, Explorateur, dossiers connus.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');

const SYSROOT = process.env.SystemRoot || 'C:\\Windows';
const POWERSHELL = path.join(SYSROOT, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
const EXPLORER = path.join(SYSROOT, 'explorer.exe');

function runPs(args, timeout = 10 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    execFile(POWERSHELL, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', ...args],
      { windowsHide: true, timeout, maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' },
      (err, stdout, stderr) => (err ? reject(new Error((stderr || err.message).trim())) : resolve(stdout)));
  });
}

// SHFileOperation + FOF_ALLOWUNDO = vraie corbeille Windows (restauration possible).
// FOF_WANTNUKEWARNING : si un élément est trop gros pour la corbeille, Windows DEMANDE
// avant de le supprimer définitivement au lieu de le faire en silence.
const RECYCLE_PS = String.raw`param([string]$In)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MenageRecycler {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  private struct SHFILEOPSTRUCT {
    public IntPtr hwnd;
    public uint wFunc;
    [MarshalAs(UnmanagedType.LPWStr)] public string pFrom;
    [MarshalAs(UnmanagedType.LPWStr)] public string pTo;
    public ushort fFlags;
    [MarshalAs(UnmanagedType.Bool)] public bool fAnyOperationsAborted;
    public IntPtr hNameMappings;
    [MarshalAs(UnmanagedType.LPWStr)] public string lpszProgressTitle;
  }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
  private static extern int SHFileOperation(ref SHFILEOPSTRUCT lpFileOp);
  public static int Recycle(string path) {
    SHFILEOPSTRUCT op = new SHFILEOPSTRUCT();
    op.wFunc = 3;
    op.pFrom = path + "\0\0";
    op.fFlags = (ushort)(0x0040 | 0x0010 | 0x0400 | 0x0004 | 0x4000);
    int r = SHFileOperation(ref op);
    if (r == 0 && op.fAnyOperationsAborted) return 1223;
    return r;
  }
}
'@
$paths = @(Get-Content -LiteralPath $In -Encoding UTF8)
for ($i = 0; $i -lt $paths.Count; $i++) {
  $p = $paths[$i]
  if (-not $p) { continue }
  $code = [MenageRecycler]::Recycle($p)
  $still = [int](Test-Path -LiteralPath $p)
  Write-Output ([string]$i + [char]9 + [string]$code + [char]9 + [string]$still)
}
`;

const RECYCLE_ERRORS = {
  2: 'introuvable', 3: 'introuvable', 5: 'accès refusé', 32: 'utilisé par un autre programme',
  0x78: 'accès refusé (droits administrateur nécessaires)', 0x7c: 'chemin trop long ou invalide',
  0xb7: 'un élément du même nom existe déjà dans la corbeille', 1223: 'annulé',
};

async function recycle(paths) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'menage-'));
  try {
    const inFile = path.join(dir, 'in.txt');
    const script = path.join(dir, 'recycle.ps1');
    await fsp.writeFile(inFile, paths.join('\r\n'), 'utf8');
    await fsp.writeFile(script, '\ufeff' + RECYCLE_PS, 'utf8');
    // Des milliers d'éléments (Temp, caches) peuvent prendre plusieurs minutes.
    const out = await runPs(['-File', script, '-In', inFile], 60 * 60 * 1000);
    const byIndex = new Map();
    for (const line of out.split(/\r?\n/)) {
      const m = /^(\d+)\t(-?\d+)\t([01])$/.exec(line.trim());
      if (m) byIndex.set(Number(m[1]), { code: Number(m[2]), still: m[3] === '1' });
    }
    return paths.map((p, i) => {
      const r = byIndex.get(i) || { code: -1, still: true };
      if (!r.still) return { path: p, ok: true };
      const why = r.code === 0 ? 'en partie seulement : des fichiers sont utilisés par un programme'
        : RECYCLE_ERRORS[r.code] || `code Windows ${r.code}`;
      return { path: p, ok: false, partial: r.code === 0, error: `Pas mis à la corbeille — ${why}` };
    });
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function detached(cmd, args, opts = {}) {
  const c = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: false, ...opts });
  c.on('error', () => {});
  c.unref();
}

const open = p => detached(EXPLORER, [p]);
const reveal = p => detached(EXPLORER, [`/select,"${p}"`], { windowsVerbatimArguments: true });
const openSpecial = what => {
  const map = {
    recycle: [EXPLORER, ['shell:RecycleBinFolder']],
    storage: [EXPLORER, ['ms-settings:storagesense']],
    apps: [EXPLORER, ['ms-settings:appsfeatures']],
    cleanmgr: [path.join(SYSROOT, 'System32', 'cleanmgr.exe'), []],
  };
  const m = map[what];
  if (!m) throw new Error('Inconnu');
  detached(m[0], m[1]);
};

const emptyRecycleBin = () => runPs(['-Command', 'Clear-RecycleBin -Force -ErrorAction SilentlyContinue'], 5 * 60 * 1000);

// Dossiers connus (Bureau, Documents… souvent redirigés vers OneDrive) + SID de l'utilisateur.
async function userInfo() {
  const script = `[Console]::OutputEncoding = [Text.Encoding]::UTF8
$k = Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
[pscustomobject]@{
  sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  desktop = $k.Desktop; documents = $k.Personal; downloads = $k.'{374DE290-123F-4565-9164-39C4925E467B}'
  pictures = $k.'My Pictures'; videos = $k.'My Video'; music = $k.'My Music'
} | ConvertTo-Json -Compress`;
  try {
    const out = await runPs(['-Command', script], 20000);
    return JSON.parse(out.trim());
  } catch {
    return {};
  }
}

module.exports = { recycle, open, reveal, openSpecial, emptyRecycleBin, userInfo, runPs };
