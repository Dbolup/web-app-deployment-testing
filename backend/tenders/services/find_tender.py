"""
Client for the UK Find a Tender Service OCDS API.

Endpoint: GET /api/1.0/ocdsReleasePackages
Docs:     https://guidance.data.gov.uk/get_data/api_documentation/
Spec:     OCDS 1.1 — https://standard.open-contracting.org/

Query parameters
----------------
limit       : int   — results per page (max ~100)
updatedFrom : str   — ISO 8601 datetime, e.g. 2026-01-01T00:00:00
updatedTo   : str   — ISO 8601 datetime
cursor      : str   — opaque cursor token for the next page (from links.next)

Pagination
----------
Cursor-based. Each response has a ``links.next`` URL containing the next
cursor token. Follow it until ``links.next`` is absent or empty.

Response shape (abbreviated)
-----------------------------
{
  "releases": [
    {
      "ocid":  "ocds-h6vhtk-000001",
      "id":    "...",
      "tag":   ["tender"],          # planning | tender | award | contract
      "date":  "2026-01-15T...",    # published date
      "buyer": {"id": "...", "name": "Cabinet Office"},
      "parties": [
        {
          "name": "Cabinet Office",
          "roles": ["buyer"],
          "address": {"region": "London", "country": "GB"},
          "contactPoint": {"email": "..."}
        }
      ],
      "planning": {
        "milestones": [],
        "documents": [{"noticeType": "UK2", "url": "..."}]
      },
      "tender": {
        "id": "...", "title": "...", "description": "...",
        "status": "active",
        "value": {"amount": 500000, "amountGross": 600000, "currency": "GBP"},
        "tenderPeriod": {"endDate": "2026-03-01T..."},   # submission deadline
        "mainProcurementCategory": "services",
        "legalBasis": {"id": "..."},
        "items": [
          {
            "id": "1",
            "additionalClassifications": [{"scheme": "CPV", "id": "72000000", "description": "IT services"}],
            "deliveryAddresses": [{"region": "South East", "country": "GB"}]
          }
        ],
        "lots": [{"id": "1", "contractPeriod": {"startDate": "...", "endDate": "..."}}]
      }
    }
  ],
  "links": {"next": "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages?cursor=..."}
}
"""

import json
import logging
import math
from datetime import timedelta
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime

logger = logging.getLogger(__name__)

BASE_URL = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages"
NOTICE_URL = "https://www.find-tender.service.gov.uk/Notice/{notice_id}"
DEFAULT_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "TenderFlowAI/1.0",
}


def _request(url: str, params: dict | None = None) -> dict:
    """GET ``url`` with optional query params and return parsed JSON."""
    headers = dict(DEFAULT_HEADERS)
    api_key = getattr(settings, "FIND_TENDER_API_KEY", "")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    resp = requests.get(url, params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _next_url(data: dict) -> str | None:
    """
    Return the full ``links.next`` URL from the response, or None on the last page.

    The API encodes the cursor AND all original query params into this URL.
    It must be followed verbatim — do not extract just the cursor token,
    as the API rejects requests where the cursor is inconsistent with the
    other query parameters.
    """
    return data.get("links", {}).get("next") or None


def fetch_releases(
    updated_from=None,
    updated_to=None,
    limit: int = 100,
    max_pages: int = 10,
) -> list[dict]:
    """
    Fetch OCDS releases from the Find a Tender Service.

    Parameters
    ----------
    updated_from : datetime | None
        Only return notices updated on or after this datetime.
        Defaults to 30 days ago.
    updated_to   : datetime | None
        Only return notices updated on or before this datetime.
    limit        : int
        Page size (max ~100 per page).
    max_pages    : int
        Safety ceiling on cursor pagination to avoid unbounded fetches.

    Returns
    -------
    list[dict]
        All releases collected across pages.
    """
    if updated_from is None:
        updated_from = timezone.now() - timedelta(days=30)

    fmt = "%Y-%m-%dT%H:%M:%S"
    params: dict = {"limit": limit}
    if updated_from:
        params["updatedFrom"] = updated_from.strftime(fmt)
    if updated_to:
        params["updatedTo"] = updated_to.strftime(fmt)

    all_releases: list[dict] = []
    # First page: use BASE_URL + params dict
    # Subsequent pages: follow links.next verbatim (full URL, no extra params)
    next_url: str | None = None

    for page in range(max_pages):
        if next_url:
            # Follow the URL exactly as returned — cursor is baked in with
            # the original query params, so passing extra params would 400.
            data = _request(next_url)
        else:
            data = _request(BASE_URL, params=params)

        releases = data.get("releases", [])
        all_releases.extend(releases)
        logger.debug(
            "Page %d: fetched %d releases (total %d)",
            page + 1, len(releases), len(all_releases),
        )

        next_url = _next_url(data)
        if not next_url or not releases:
            break

    return all_releases


# ---------------------------------------------------------------------------
# JSON sanitisation
# ---------------------------------------------------------------------------

def _sanitize_json(data) -> object:
    """
    Round-trip ``data`` through JSON to produce a value that passes
    SQLite's JSON_VALID() check (enforced by Django 6 on JSONField).

    Specifically handles:
    - float NaN / Infinity → replaced with None (null in JSON)
    - Any other non-serialisable type → converted to its string repr
    """
    class _SafeEncoder(json.JSONEncoder):
        def iterencode(self, o, _one_shot=False):
            # Walk the structure before encoding
            return super().iterencode(self._clean(o), _one_shot)

        def _clean(self, obj):
            if isinstance(obj, float):
                if math.isnan(obj) or math.isinf(obj):
                    return None
                return obj
            if isinstance(obj, dict):
                return {k: self._clean(v) for k, v in obj.items()}
            if isinstance(obj, (list, tuple)):
                return [self._clean(v) for v in obj]
            return obj

    return json.loads(json.dumps(data, cls=_SafeEncoder))


# ---------------------------------------------------------------------------
# Field extraction helpers
# ---------------------------------------------------------------------------

def _get_buyer(release: dict) -> str:
    """Buyer name from release.buyer, or first party with role 'buyer'."""
    name = (release.get("buyer") or {}).get("name", "")
    if name:
        return name
    for party in release.get("parties", []):
        if "buyer" in party.get("roles", []):
            return party.get("name", "")
    return ""


def _get_department(release: dict) -> str:
    """Procuring entity name — may differ from buyer on framework call-offs."""
    for party in release.get("parties", []):
        if any(r in party.get("roles", []) for r in ("procuringEntity", "buyer")):
            return party.get("name", "")
    return ""


def _get_location(release: dict) -> str:
    """
    Human-readable location for the contract delivery.

    Priority:
    1. items[].deliveryAddresses[].locality  (e.g. "London")
    2. items[].deliveryAddresses[].countryName
    3. buyer party address.locality
    4. buyer party address.countryName
    5. items[].deliveryAddresses[].region    (NUTS code — last resort)

    The ``region`` field contains NUTS2/3 codes (e.g. UKI32) which are not
    human-readable, so we only fall back to them when nothing better exists.
    """
    # Try delivery addresses on tender items first
    for item in release.get("tender", {}).get("items", []):
        for addr in item.get("deliveryAddresses", []):
            loc = addr.get("locality") or addr.get("countryName")
            if loc:
                return loc

    # Fall back to the buyer party's postal address
    for party in release.get("parties", []):
        if "buyer" in party.get("roles", []):
            addr = party.get("address", {})
            loc = addr.get("locality") or addr.get("countryName")
            if loc:
                return loc

    # Last resort: return NUTS region code if nothing else is available
    for item in release.get("tender", {}).get("items", []):
        for addr in item.get("deliveryAddresses", []):
            if addr.get("region"):
                return addr["region"]

    return ""


def _all_items(release: dict) -> list[dict]:
    """
    Collect items from tender, awards, and contracts so CPV codes are found
    regardless of notice type (tender vs award vs contract).
    """
    items: list[dict] = list(release.get("tender", {}).get("items", []))
    for award in release.get("awards", []):
        items.extend(award.get("items", []))
    for contract in release.get("contracts", []):
        items.extend(contract.get("items", []))
    return items


def _get_cpv_codes(release: dict) -> list[dict]:
    """CPV codes from items across tender, awards and contracts."""
    seen: set[str] = set()
    codes: list[dict] = []
    for item in _all_items(release):
        for cls in item.get("additionalClassifications", []):
            if cls.get("scheme") == "CPV":
                code_id = cls.get("id", "")
                if code_id and code_id not in seen:
                    seen.add(code_id)
                    codes.append({"id": code_id, "description": cls.get("description", "")})
    return codes


def _get_industry(release: dict) -> str:
    """First CPV description, or mainProcurementCategory as fallback."""
    codes = _get_cpv_codes(release)
    if codes:
        return codes[0]["description"]
    return release.get("tender", {}).get("mainProcurementCategory", "")


def _all_documents(release: dict) -> list[dict]:
    """
    Yield every document object in the release, regardless of which object
    it lives under (planning, tender, awards[], contracts[]).

    Award and contract notices attach their find-tender URL and UK notice
    type code to awards[].documents[], not planning.documents[].
    """
    docs: list[dict] = []
    docs.extend(release.get("planning", {}).get("documents", []))
    docs.extend(release.get("tender", {}).get("documents", []))
    for award in release.get("awards", []):
        docs.extend(award.get("documents", []))
    for contract in release.get("contracts", []):
        docs.extend(contract.get("documents", []))
    return docs


def _get_notice_type(release: dict) -> str:
    """
    UK notice type code (e.g. UK2, UK4, UK5) searched across all document
    objects in the release (planning, tender, awards, contracts).
    Falls back to the first OCDS tag (tender | planning | award | contract).
    """
    for doc in _all_documents(release):
        nt = doc.get("noticeType", "")
        if nt:
            return nt
    tags = release.get("tag", [])
    return tags[0] if tags else ""


def _get_source_url(release: dict) -> str:
    """
    Canonical Find a Tender notice URL.

    Search order:
    1. Any document across planning / tender / awards / contracts whose URL
       contains 'find-tender.service.gov.uk'.
    2. Construct from release.id (e.g. '044080-2026') which is the notice
       reference displayed in the URL path.
    3. Last resort: numeric suffix of the ocid.
    """
    for doc in _all_documents(release):
        url = doc.get("url", "")
        if url and "find-tender.service.gov.uk" in url:
            return url

    # release.id is the notice reference (e.g. "044080-2026")
    release_id = release.get("id", "")
    if release_id:
        return NOTICE_URL.format(notice_id=release_id)

    return ""


def _get_value(release: dict) -> dict | None:
    """
    Find the best value object for the notice.

    Tender notices carry value in tender.value.
    Award/contract notices carry it in awards[].value or contracts[].value
    (tender.value is usually absent on these).
    """
    v = release.get("tender", {}).get("value")
    if v:
        return v
    for award in release.get("awards", []):
        if award.get("value"):
            return award["value"]
    for contract in release.get("contracts", []):
        if contract.get("value"):
            return contract["value"]
    return None


def _parse_budget(release: dict) -> tuple:
    """
    Return (budget_min, budget_max, budget_display).

    value.amount      → net (ex-VAT)  → budget_min
    value.amountGross → gross (inc-VAT) → budget_max

    Falls back across tender → awards → contracts.
    """
    value = _get_value(release) or {}
    raw_min = value.get("amount")
    raw_max = value.get("amountGross") or value.get("amount")
    currency = value.get("currency", "GBP")
    symbol = "£" if currency == "GBP" else currency

    budget_min = budget_max = None
    try:
        if raw_min is not None:
            budget_min = Decimal(str(raw_min))
        if raw_max is not None:
            budget_max = Decimal(str(raw_max))
    except (InvalidOperation, TypeError):
        pass

    if budget_max:
        budget_display = f"{symbol}{_fmt(budget_max)}"
        if budget_min and budget_min != budget_max:
            budget_display = f"{symbol}{_fmt(budget_min)} – {symbol}{_fmt(budget_max)}"
    else:
        budget_display = "Not specified"

    return budget_min, budget_max, budget_display


def _fmt(amount: Decimal) -> str:
    if amount >= 1_000_000:
        return f"{amount / 1_000_000:.1f}M"
    if amount >= 1_000:
        return f"{amount / 1_000:.0f}k"
    return f"{amount:.0f}"


def _parse_date(value: str | None):
    if not value:
        return None
    dt = parse_datetime(value)
    if dt and timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return dt


def _get_deadline(release: dict):
    """
    Submission deadline from tender.tenderPeriod.endDate.
    Not present on award/contract notices (deadline has already passed).
    """
    return _parse_date(
        (release.get("tender", {}).get("tenderPeriod") or {}).get("endDate")
    )


# ---------------------------------------------------------------------------
# Main parse function
# ---------------------------------------------------------------------------

def parse_release(release: dict) -> dict | None:
    """
    Convert a raw OCDS release dict into a dict suitable for
    ``Tender.objects.update_or_create(ref_id=..., defaults=...)``.

    Returns None if the release has no usable ocid.
    """
    ocid = release.get("ocid", "").strip()
    if not ocid:
        return None

    tender = release.get("tender", {})
    title = tender.get("title", "").strip()
    if not title:
        return None

    cpv_codes = _get_cpv_codes(release)
    budget_min, budget_max, budget_display = _parse_budget(release)

    return {
        "ref_id": ocid,
        "title": title,
        "organization": _get_buyer(release),
        "department": _get_department(release),
        "description": tender.get("description", "").strip(),
        "budget_min": budget_min,
        "budget_max": budget_max,
        "budget_display": budget_display,
        "deadline": _get_deadline(release),
        "published_date": _parse_date(release.get("date")),
        "location": _get_location(release),
        "industry": _get_industry(release),
        "cpv_codes": cpv_codes,
        "notice_type": _get_notice_type(release),
        "source_url": _get_source_url(release),
        "raw_data": release,
    }


# ---------------------------------------------------------------------------
# High-level service class
# ---------------------------------------------------------------------------

class FindTenderService:
    """
    Orchestrates fetching OCDS releases, parsing them, and persisting to DB.

    Usage::

        service = FindTenderService()
        log = service.fetch_and_store(days_back=7, keywords=["cloud", "infrastructure"])
    """

    def fetch_and_store(
        self,
        days_back: int = 30,
        updated_from=None,
        updated_to=None,
        keywords: list[str] | None = None,
        limit: int = 100,
        max_pages: int = 20,
    ):
        """
        Fetch releases from the API, apply optional keyword filtering,
        upsert into the Tender table, and return a FetchLog record.

        Parameters
        ----------
        days_back    : int   — how far back to look if updated_from is not given
        updated_from : datetime | None
        updated_to   : datetime | None
        keywords     : list[str] | None
            Client-side keyword filter applied to title + description.
            The FTS API has no server-side keyword search parameter.
        limit        : int   — page size passed to the API
        max_pages    : int   — max pages to follow via cursor pagination
        """
        from tenders.models import Tender, FetchLog

        if updated_from is None:
            updated_from = timezone.now() - timedelta(days=days_back)

        log_data = {
            "status": FetchLog.FetchStatus.SUCCESS,
            "tenders_found": 0,
            "tenders_new": 0,
            "tenders_updated": 0,
            "query_params": {
                "updated_from": updated_from.isoformat(),
                "keywords": keywords or [],
                "limit": limit,
            },
            "error_message": "",
        }

        try:
            releases = fetch_releases(
                updated_from=updated_from,
                updated_to=updated_to,
                limit=limit,
                max_pages=max_pages,
            )
            log_data["tenders_found"] = len(releases)

            # Client-side keyword filter (API has no server-side search param)
            if keywords:
                kw_lower = [k.lower() for k in keywords]
                releases = [
                    r for r in releases
                    if any(
                        kw in (r.get("tender", {}).get("title", "") + " " + r.get("tender", {}).get("description", "")).lower()
                        for kw in kw_lower
                    )
                ]

            skipped = 0
            for release in releases:
                tender_data = parse_release(release)
                if not tender_data:
                    continue
                ref_id = tender_data.pop("ref_id")
                # Sanitize raw_data: round-trip through JSON to strip any
                # NaN/Infinity floats that would fail SQLite's JSON_VALID check.
                tender_data["raw_data"] = _sanitize_json(tender_data["raw_data"])
                try:
                    _, created = Tender.objects.update_or_create(
                        ref_id=ref_id, defaults=tender_data
                    )
                    if created:
                        log_data["tenders_new"] += 1
                    else:
                        log_data["tenders_updated"] += 1
                except Exception as row_exc:
                    skipped += 1
                    logger.warning("Skipping %s: %s", ref_id, row_exc)

            if skipped:
                log_data["status"] = FetchLog.FetchStatus.PARTIAL
                log_data["error_message"] = f"{skipped} record(s) skipped due to DB errors"

        except requests.Timeout:
            log_data["status"] = FetchLog.FetchStatus.FAILED
            log_data["error_message"] = "Request timed out reaching find-tender.service.gov.uk"
        except requests.HTTPError as exc:
            log_data["status"] = FetchLog.FetchStatus.FAILED
            log_data["error_message"] = f"HTTP {exc.response.status_code}: {exc.response.text[:200]}"
        except requests.RequestException as exc:
            log_data["status"] = FetchLog.FetchStatus.FAILED
            log_data["error_message"] = str(exc)
        except Exception as exc:
            log_data["status"] = FetchLog.FetchStatus.PARTIAL
            log_data["error_message"] = f"{type(exc).__name__}: {exc}"
            logger.exception("Unexpected error during tender fetch")

        return FetchLog.objects.create(**log_data)
