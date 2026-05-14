from django.core.management.base import BaseCommand
from tenders.services.find_tender import FindTenderService


class Command(BaseCommand):
    help = 'Fetch tenders from Find a Tender Service (find-tender.service.gov.uk)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keywords', nargs='+', type=str,
            help='Client-side keyword filter applied to title + description '
                 '(the API has no server-side search). '
                 'Example: --keywords "cloud migration" "IT services"',
        )
        parser.add_argument(
            '--days-back', type=int, default=30,
            help='Fetch notices updated within this many days (default: 30). '
                 'Passed as updatedFrom to the API.',
        )
        parser.add_argument(
            '--limit', type=int, default=100,
            help='Page size per API request (default: 100).',
        )
        parser.add_argument(
            '--max-pages', type=int, default=20,
            help='Maximum number of cursor pages to follow (default: 20).',
        )

    def handle(self, *args, **options):
        keywords = options.get('keywords') or []
        days_back = options['days_back']
        limit = options['limit']
        max_pages = options['max_pages']

        self.stdout.write(
            f'Fetching tenders updated in the last {days_back} day(s) '
            f'(limit={limit}, max_pages={max_pages})'
        )
        if keywords:
            self.stdout.write(f'Keyword filter: {", ".join(keywords)}')

        service = FindTenderService()
        log = service.fetch_and_store(
            days_back=days_back,
            keywords=keywords,
            limit=limit,
            max_pages=max_pages,
        )

        if log.status == 'success':
            self.stdout.write(self.style.SUCCESS(
                f'Done. Found: {log.tenders_found}, '
                f'New: {log.tenders_new}, Updated: {log.tenders_updated}'
            ))
        elif log.status == 'partial':
            self.stdout.write(self.style.WARNING(
                f'Partial. Found: {log.tenders_found}, New: {log.tenders_new}. '
                f'Error: {log.error_message}'
            ))
        else:
            self.stdout.write(self.style.ERROR(f'Failed: {log.error_message}'))
