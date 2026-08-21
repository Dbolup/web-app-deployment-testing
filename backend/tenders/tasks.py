import logging

from celery import shared_task

from tenders.services.find_tender import FindTenderService

logger = logging.getLogger(__name__)


@shared_task
def fetch_tenders_task(days_back: int = 1, limit: int = 100, max_pages: int = 20):
    """Periodic fetch — a short days_back window keeps each 30-minute run cheap."""
    service = FindTenderService()
    log = service.fetch_and_store(days_back=days_back, limit=limit, max_pages=max_pages)

    if log.status != 'success':
        logger.warning('fetch_tenders_task finished with status=%s: %s', log.status, log.error_message)

    return {
        'status': log.status,
        'found': log.tenders_found,
        'new': log.tenders_new,
        'updated': log.tenders_updated,
    }
