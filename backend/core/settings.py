from pathlib import Path
from datetime import timedelta
import os
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Local apps
    'accounts',
    'tenders',
    'pipeline',
    'documents',
    'dashboard',
    'integrations',
    'ai_review',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = os.getenv('MEDIA_URL', '/media/')
MEDIA_ROOT = BASE_DIR / os.getenv('MEDIA_ROOT', 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

APP_URL = os.getenv('APP_URL', 'http://localhost:3005')

# Background tasks (Django 6.0 built-in tasks)
TASKS = {
    "default": {
        "BACKEND": os.getenv(
            "DJANGO_TASKS_BACKEND",
            "django.tasks.backends.immediate.ImmediateBackend",
        ),
    }
}

# Celery
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_BEAT_SCHEDULE = {
    'fetch-tenders-every-30-minutes': {
        'task': 'tenders.tasks.fetch_tenders_task',
        'schedule': crontab(minute='*/30'),
    },
}

# Email
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@tenderflow.ai')

# CORS
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3005,http://127.0.0.1:3005'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# drf-spectacular
SPECTACULAR_SETTINGS = {
    'TITLE': 'TenderFlow AI API',
    'DESCRIPTION': (
        'REST API for TenderFlow AI — a procurement intelligence platform that discovers, '
        'qualifies, and manages UK government tenders sourced from '
        'find-tender.service.gov.uk.\n\n'
        '## Authentication\n'
        'All endpoints (except `/api/auth/register/` and `/api/auth/login/`) require a '
        'JWT Bearer token in the `Authorization` header.\n\n'
        '```\nAuthorization: Bearer <access_token>\n```\n\n'
        'Obtain tokens via `POST /api/auth/login/`. Refresh them via '
        '`POST /api/auth/token/refresh/`.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,
    'TAGS': [
        {'name': 'Auth', 'description': 'User registration, login, profile and team management'},
        {'name': 'Tenders', 'description': 'Browse, search, score and fetch tenders from find-tender.service.gov.uk'},
        {'name': 'Pipeline', 'description': 'Manage the procurement Kanban pipeline across 8 stages'},
        {'name': 'Documents', 'description': 'Upload tender documents and trigger AI section extraction'},
        {'name': 'Dashboard', 'description': 'Stats, trend data and activity feed'},
        {'name': 'Integrations', 'description': 'Connect external platforms (Confluence, Slack, etc.)'},
        {'name': 'AI Review', 'description': 'Company onboarding, AI tender review, capability analysis and human feedback'},
    ],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
    },
    'ENUM_NAME_OVERRIDES': {
        # Resolve collisions across apps that each define a "status" or "role" field
        'UserRoleEnum': 'accounts.models.User.Role',
        'TeamMemberRoleEnum': 'accounts.models.TeamMember.Role',
        'TeamMemberStatusEnum': 'accounts.models.TeamMember.Status',
        'WorkspaceAISensitivityEnum': 'accounts.models.Workspace.AISensitivity',
        'TenderScoreStatusEnum': 'tenders.models.TenderScore.Status',
        'TenderScoreRiskLevelEnum': 'tenders.models.TenderScore.RiskLevel',
        'FetchLogStatusEnum': 'tenders.models.FetchLog.FetchStatus',
        'PipelineStageEnum': 'pipeline.models.PipelineItem.Stage',
        'DocumentStatusEnum': 'documents.models.Document.Status',
        'ExtractedSectionTypeEnum': 'documents.models.ExtractedSection.SectionType',
        'ActivityTypeEnum': 'dashboard.models.Activity.ActivityType',
        'IntegrationTypeEnum': 'integrations.models.Integration.IntegrationType',
        'IntegrationStatusEnum': 'integrations.models.Integration.Status',
        'AIReviewStatusEnum': 'ai_review.models.AIReview.ReviewStatus',
        'AIReviewRecommendationEnum': 'ai_review.models.AIReview.Recommendation',
    },
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60))
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Find a Tender Service API
FIND_TENDER_API_BASE_URL = os.getenv(
    'FIND_TENDER_API_BASE_URL',
    'https://www.find-tender.service.gov.uk/api/1.0'
)
FIND_TENDER_API_KEY = os.getenv('FIND_TENDER_API_KEY', '')

# Anthropic AI
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
