from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    # OpenAPI schema + UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # App routes
    path('api/auth/', include('accounts.urls')),
    path('api/tenders/', include('tenders.urls')),
    path('api/pipeline/', include('pipeline.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/integrations/', include('integrations.urls')),
    path('api/ai-review/', include('ai_review.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
