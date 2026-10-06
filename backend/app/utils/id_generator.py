"""Custom ID Generator for Users (TSC-YYAANNNN) and Companies (CID-YYAANNNN)."""

def generate_custom_id(prefix: str, id_or_seq, role: str | None = None, year: int = 2026) -> str:
    if prefix == "TSC" and role and role.lower() in ["super admin", "superadmin"]:
        return "TSC-000000"

    yy = str(year)[-2:]
    if isinstance(id_or_seq, int):
        n = id_or_seq
    elif isinstance(id_or_seq, str):
        try:
            hex_part = id_or_seq.replace("-", "")[:6]
            n = (int(hex_part, 16) % 9999) + 1
        except Exception:
            n = 1
    else:
        n = 1

    series_idx = (n - 1) // 9999
    char1 = chr(ord('A') + (series_idx // 26))
    char2 = chr(ord('A') + (series_idx % 26))
    num_part = f"{((n - 1) % 9999) + 1:04d}"

    return f"{prefix}-{yy}{char1}{char2}{num_part}"
